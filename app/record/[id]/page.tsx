'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculateBACFromDrink, getBACStatus } from '@/app/lib/bacCalculator';

const DRINK_TYPES = [
  { value: 'beer', label: 'ビール' },
  { value: 'wine', label: 'ワイン' },
  { value: 'sake', label: '日本酒' },
  { value: 'shochu', label: '焼酎' },
  { value: 'whiskey', label: 'ウイスキー' },
  { value: 'cocktail', label: 'カクテル' },
  { value: 'other', label: 'その他' },
];

export default function RecordEditPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount_ml: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 記録を取得
      const recordResponse = await fetch(`/api/records?id=${recordId}`);
      if (recordResponse.ok) {
        const recordData = await recordResponse.json();
        setRecord(recordData);
        setFormData({
          type: recordData.type || '',
          amount_ml: recordData.amount_ml?.toString() || '',
        });
      }

      // プロフィールを取得
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/records?id=${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type || null,
          amount_ml: formData.amount_ml ? parseInt(formData.amount_ml) : null,
        }),
      });

      if (response.ok) {
        alert('記録を更新しました');
        router.push('/');
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating record:', error);
      alert('更新中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const response = await fetch(`/api/records?id=${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('記録を削除しました');
        router.push('/');
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">記録が見つかりません</div>
      </div>
    );
  }

  // BAC計算
  const bac = calculateBACFromDrink(
    formData.amount_ml ? parseInt(formData.amount_ml) : null,
    formData.type,
    profile?.weight_kg,
    profile?.sex
  );
  const bacStatus = getBACStatus(bac);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">記録の編集</h1>
          <p className="text-gray-600 text-sm mt-1">
            作成日時: {new Date(record.created_at).toLocaleString('ja-JP')}
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                酒の種類
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {DRINK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                量 (ml)
              </label>
              <input
                type="number"
                value={formData.amount_ml}
                onChange={(e) => setFormData({ ...formData, amount_ml: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 350"
                min="0"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                1杯あたりの量を入力してください
              </p>
            </div>

            {profile?.weight_kg && formData.amount_ml && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">BAC計算結果</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600">推定BAC</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {bac.toFixed(3)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">{bacStatus.icon}</div>
                    <div className={`text-sm font-medium ${bacStatus.color}`}>
                      {bacStatus.description}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  体重: {profile.weight_kg}kg, 性別: {profile.sex === 'male' ? '男性' : '女性'}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                削除
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">BAC計算について</h3>
          <p className="text-sm text-gray-600 mb-3">
            BAC（血中アルコール濃度）はWidmark公式に基づいて計算されます。
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>・男性: 体内水分率 0.68</p>
            <p>・女性: 体内水分率 0.55</p>
            <p>・代謝率: 0.015%/h</p>
            <p>・アルコール密度: 0.789 g/ml</p>
          </div>
        </div>
      </div>
    </div>
  );
}
