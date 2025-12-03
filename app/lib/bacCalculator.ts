/**
 * BAC (Blood Alcohol Concentration) 計算ユーティリティ
 * Widmark公式に基づく計算
 * BAC = (アルコール摂取量[g] / (体重[kg] * r)) - β * 経過時間[h]
 */

// 体内水分率 (r)
const R_VALUES = {
  male: 0.68,   // 男性
  female: 0.55, // 女性
  default: 0.68 // デフォルト（性別未設定時）
} as const;

// 代謝率 (β) - 時間あたりのBAC減少率
const METABOLISM_RATE = 0.015; // 0.015%/h

// アルコールの密度 (g/ml)
const ALCOHOL_DENSITY = 0.789;

/**
 * 酒の種類ごとのアルコール度数 (%)
 */
const ALCOHOL_PERCENTAGES = {
  beer: 5,        // ビール
  wine: 12,       // ワイン
  sake: 15,       // 日本酒
  shochu: 25,     // 焼酎
  whiskey: 40,    // ウイスキー
  cocktail: 20,   // カクテル
  other: 10,      // その他
} as const;

/**
 * アルコール摂取量(ml)からアルコール量(g)を計算
 */
export function calculateAlcoholGrams(amountMl: number, alcoholPercentage: number): number {
  return amountMl * (alcoholPercentage / 100) * ALCOHOL_DENSITY;
}

/**
 * BACを計算（単位: %）
 */
export function calculateBAC(
  alcoholGrams: number,
  weightKg: number,
  sex: 'male' | 'female' | string,
  hoursSinceDrinking: number = 0
): number {
  if (weightKg <= 0) return 0;
  
  const r = sex === 'male' ? R_VALUES.male : 
            sex === 'female' ? R_VALUES.female : 
            R_VALUES.default;
  
  // Widmark公式: BAC(%) = (アルコールg / (体重kg * r)) - (代謝率 * 経過時間h)
  const initialBAC = (alcoholGrams / (weightKg * r * 1000)) * 100; // %に変換
  const metabolizedBAC = METABOLISM_RATE * hoursSinceDrinking;
  const currentBAC = initialBAC - metabolizedBAC;
  
  return Math.max(0, currentBAC); // BACは0以下にならない
}

/**
 * BAC値からステータスを取得
 */
export function getBACStatus(bac: number): {
  level: string;
  description: string;
  icon: string;
  color: string;
} {
  if (bac < 0.02) {
    return {
      level: 'normal',
      description: '正常',
      icon: '🙂',
      color: 'text-green-500'
    };
  } else if (bac < 0.05) {
    return {
      level: 'mild',
      description: '軽い酔い',
      icon: '😊',
      color: 'text-yellow-500'
    };
  } else if (bac < 0.10) {
    return {
      level: 'moderate',
      description: '注意力低下',
      icon: '😵‍💫',
      color: 'text-orange-500'
    };
  } else if (bac < 0.20) {
    return {
      level: 'high',
      description: '明確な酩酊',
      icon: '😵',
      color: 'text-red-500'
    };
  } else {
    return {
      level: 'severe',
      description: '強い酩酊',
      icon: '💀',
      color: 'text-purple-500'
    };
  }
}

/**
 * 飲酒記録からBACを計算（単一の記録）
 */
export function calculateBACFromDrink(
  amountMl: number | null = 500,
  drinkType: string | null = "beer",
  weightKg: number | null = 60,
  sex: string | null,
  hoursSinceDrinking: number = 0
): number {
  if (!amountMl || !weightKg) return 0;
  
  const alcoholPercentage = drinkType && ALCOHOL_PERCENTAGES[drinkType as keyof typeof ALCOHOL_PERCENTAGES]
    ? ALCOHOL_PERCENTAGES[drinkType as keyof typeof ALCOHOL_PERCENTAGES]
    : ALCOHOL_PERCENTAGES.other;
  
  const alcoholGrams = calculateAlcoholGrams(amountMl, alcoholPercentage);
  return calculateBAC(alcoholGrams, weightKg, sex || 'male', hoursSinceDrinking);
}

/**
 * 複数の飲酒記録から合計BACを計算（各記録ごとに個別に代謝を計算）
 */
export function calculateTotalBAC(
  drinks: Array<{ amount_ml: number | null; type: string | null; created_at: Date }>,
  weightKg: number = 60,
  sex: string | null
): number {
  if (drinks.length === 0) return 0;
  
  const now = new Date();
  let totalBAC = 0;
  
  // 各飲酒記録ごとに個別にBACを計算して合算
  drinks.forEach(drink => {
    if (!drink.amount_ml) return;
    
    const alcoholPercentage = drink.type && ALCOHOL_PERCENTAGES[drink.type as keyof typeof ALCOHOL_PERCENTAGES]
      ? ALCOHOL_PERCENTAGES[drink.type as keyof typeof ALCOHOL_PERCENTAGES]
      : ALCOHOL_PERCENTAGES.other;
    
    const alcoholGrams = calculateAlcoholGrams(drink.amount_ml, alcoholPercentage);
    
    // この飲酒からの経過時間を計算
    const hoursSinceDrinking = (now.getTime() - drink.created_at.getTime()) / (1000 * 60 * 60);
    
    // この飲酒によるBACを計算（代謝も考慮）
    const drinkBAC = calculateBAC(alcoholGrams, weightKg, sex || 'male', hoursSinceDrinking);
    
    totalBAC += drinkBAC;
  });
  
  return totalBAC;
}