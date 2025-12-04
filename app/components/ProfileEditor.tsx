'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  name: string | null;
  sex: string | null;
  weight_kg: number | null;
  user?: {
    email: string;
    name: string | null;
  };
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // 保存状態を追加
  const [formData, setFormData] = useState({
    name: '',
    sex: '',
    weight_kg: '',
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          sex: data.sex || '',
          weight_kg: data.weight_kg?.toString() || '',
        });
      } else if (response.status === 404) {
        // プロフィールが存在しない場合
        setProfile(null);
        setFormData({ name: '', sex: '', weight_kg: '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // 必須チェック（体重と性別はBAC計算に必須）
    if (!formData.sex || !formData.weight_kg) {
        alert('性別と体重は必須です');
        setIsSaving(false);
        return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          sex: formData.sex || null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        alert('プロフィールを更新しました');
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('更新中にエラーが発生しました');
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            読み込み中...
        </div>
    );
  }
  
  // BAC計算に必須の項目に関する注意書き
  const requiredFieldsNote = (
    <p className="text-xs text-red-500 mt-2 p-3 bg-red-50/50 rounded-lg border border-red-200 dark:bg-red-950/30 dark:border-red-800">
        ※ 性別と体重は、正確な**血中アルコール濃度 (BAC) を計算するために必須**です。
    </p>
  );

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 
                       text-gray-900 dark:text-white">
        プロフィール設定
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 
                            text-gray-700 dark:text-gray-300">
            名前
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                       bg-white dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            placeholder={profile?.user?.name || '例: 飲兵衛太郎'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 
                            text-gray-700 dark:text-gray-300">
            性別 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.sex}
            onChange={(e) =>
              setFormData({ ...formData, sex: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                       bg-white dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
          >
            <option value="">選択してください</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 
                            text-gray-700 dark:text-gray-300">
            体重 (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.weight_kg}
            onChange={(e) =>
              setFormData({ ...formData, weight_kg: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                       bg-white dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            placeholder="例: 65.0"
            min="10"
            max="300"
          />
        </div>
        
        {requiredFieldsNote}

        <button
          type="submit"
          disabled={isSaving || !formData.sex || !formData.weight_kg}
          // ページのメインボタンと同じ紫に変更
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 
                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </form>
    </>
  );
}