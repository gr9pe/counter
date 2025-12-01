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
 * BACを計算
 */
export function calculateBAC(
  alcoholGrams: number,
  weightKg: number,
  sex: 'male' | 'female' | string,
  hoursSinceDrinking: number = 0
): number {
  const r = sex === 'male' ? R_VALUES.male : 
            sex === 'female' ? R_VALUES.female : 
            R_VALUES.default;
  
  if (weightKg <= 0) return 0;
  
  const bac = (alcoholGrams / (weightKg * r)) - (METABOLISM_RATE * hoursSinceDrinking);
  return Math.max(0, bac); // BACは0以下にならない
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
      icon: '😐',
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
 * 飲酒記録からBACを計算
 */
export function calculateBACFromDrink(
  amountMl: number | null,
  drinkType: string | null,
  weightKg: number | null,
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
 * 複数の飲酒記録から合計BACを計算
 */
export function calculateTotalBAC(
  drinks: Array<{ amount_ml: number | null; type: string | null; created_at: Date }>,
  weightKg: number | null,
  sex: string | null
): number {
  if (!weightKg || drinks.length === 0) return 0;
  
  let totalAlcoholGrams = 0;
  const now = new Date();
  
  drinks.forEach(drink => {
    if (!drink.amount_ml) return;
    
    const alcoholPercentage = drink.type && ALCOHOL_PERCENTAGES[drink.type as keyof typeof ALCOHOL_PERCENTAGES]
      ? ALCOHOL_PERCENTAGES[drink.type as keyof typeof ALCOHOL_PERCENTAGES]
      : ALCOHOL_PERCENTAGES.other;
    
    const alcoholGrams = calculateAlcoholGrams(drink.amount_ml, alcoholPercentage);
    totalAlcoholGrams += alcoholGrams;
  });
  
  // 最後の飲酒からの経過時間を計算
  const lastDrinkTime = drinks.reduce((latest, drink) => {
    return drink.created_at > latest ? drink.created_at : latest;
  }, new Date(0));
  
  const hoursSinceLastDrink = (now.getTime() - lastDrinkTime.getTime()) / (1000 * 60 * 60);
  
  return calculateBAC(totalAlcoholGrams, weightKg, sex || 'male', hoursSinceLastDrink);
}
