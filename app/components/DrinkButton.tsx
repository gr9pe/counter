'use client';

import { useState } from 'react';

interface DrinkButtonProps {
  onDrinkRecorded: () => void;
}

export default function DrinkButton({ onDrinkRecorded }: DrinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickDrink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_ml: null, // 後で編集可能
          type: null, // 後で編集可能
        }),
      });

      if (response.ok) {
        onDrinkRecorded();
        alert('1杯記録しました！後で詳細を編集できます。');
      } else {
        const error = await response.json();
        alert(`記録に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Error recording drink:', error);
      alert('記録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleQuickDrink}
      disabled={isLoading}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '記録中...' : '1杯飲んだ！'}
    </button>
  );
}
