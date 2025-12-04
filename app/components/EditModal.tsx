import { useState } from 'react';

interface DrinkRecord {
  id: string;
  amount_ml: number | null;
  type: string | null;
  created_at: string;
}

interface DrinkEditModalProps {
  record: DrinkRecord;
  onClose: () => void;
  onUpdate: () => void;
}

const DRINK_TYPES = [
  { value: 'beer', label: 'ビール', defaultAmount: 350 },
  { value: 'wine', label: 'ワイン', defaultAmount: 120 },
  { value: 'sake', label: '日本酒', defaultAmount: 180 },
  { value: 'shochu', label: '焼酎', defaultAmount: 90 },
  { value: 'whiskey', label: 'ウイスキー', defaultAmount: 45 },
  { value: 'cocktail', label: 'カクテル', defaultAmount: 200 },
  { value: 'other', label: 'その他', defaultAmount: 100 },
];

export default function DrinkEditModal({ record, onClose, onUpdate }: DrinkEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: record.type || '',
    amount_ml: record.amount_ml?.toString() || '',
  });

  const handleTypeChange = (newType: string) => {
    const drinkType = DRINK_TYPES.find(t => t.value === newType);
    setFormData({
      type: newType,
      amount_ml: drinkType ? drinkType.defaultAmount.toString() : formData.amount_ml,
    });
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.amount_ml) {
      alert('種類と量を入力してください');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/records?id=${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          amount_ml: parseInt(formData.amount_ml),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新に失敗しました');
      }

      onUpdate(); // 親コンポーネントでBAC再計算
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新中にエラーが発生しました';
      alert(errorMessage);
      console.error('Error updating record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      // ページと統一された背景とブラー
      className="fixed inset-0 z-50 flex items-center justify-center 
                 bg-neutral-900/40 dark:bg-neutral-900/60 backdrop-blur-sm p-4"
      onClick={onClose} // 背景クリックで閉じる
    >
      <div 
        // ページと統一されたモーダル本体のスタイル
        className="rounded-2xl shadow-lg w-full max-w-md p-6 relative
                   max-h-[90vh] overflow-y-auto
                   bg-white dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()} // 内側クリックで閉じない
      >
        {/* 閉じるボタン (ProfileEditorと同じ絶対配置のスタイル) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 
                    dark:text-gray-50 dark:hover:text-white text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 
                       text-gray-900 dark:text-white">
            記録を編集
        </h2>

        <div className="space-y-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            記録日時: {new Date(record.created_at).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* 酒の種類 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              酒の種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                         bg-white dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="">選択してください</option>
              {DRINK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} (標準 {type.defaultAmount}ml)
                </option>
              ))}
            </select>
          </div>

          {/* 量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              量 (ml) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount_ml}
              onChange={(e) => setFormData({ ...formData, amount_ml: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                         bg-white dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              placeholder="例: 350"
              min="1"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              1杯あたりの量を入力してください
            </p>
          </div>

          {/* クイック選択ボタン (ダークモード対応) */}
          {formData.type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                よく使う量
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* ビール */}
                {formData.type === 'beer' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '350' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      缶 (350ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '500' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      大缶 (500ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '250' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      小瓶 (250ml)
                    </button>
                  </>
                )}
                {/* ワイン */}
                {formData.type === 'wine' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '120' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      グラス (120ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '180' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      大グラス (180ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '750' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ボトル (750ml)
                    </button>
                  </>
                )}
                {/* 日本酒 */}
                {formData.type === 'sake' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '180' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      一合 (180ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '360' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      二合 (360ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '90' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      お猪口 (90ml)
                    </button>
                  </>
                )}
                {/* 焼酎 */}
                {formData.type === 'shochu' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '90' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ロック (90ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '180' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      水割り (180ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '250' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      お茶割り (250ml)
                    </button>
                  </>
                )}
                {/* ウイスキー */}
                {formData.type === 'whiskey' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '45' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      シングル (45ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '90' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ダブル (90ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '250' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ハイボール (250ml)
                    </button>
                  </>
                )}
                {/* カクテル */}
                {formData.type === 'cocktail' && (
                  <>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '150' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ショート (150ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '200' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      標準 (200ml)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, amount_ml: '300' })}
                      className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-700 dark:text-gray-300"
                    >
                      ロング (300ml)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg 
                         hover:bg-gray-50 transition-colors 
                         dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.type || !formData.amount_ml}
              // ページのメインボタンと同じ紫に変更
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 
                         rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}