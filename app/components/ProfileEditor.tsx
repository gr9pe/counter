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
  const [isEditing, setIsEditing] = useState(false);
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
        setIsEditing(false);
        alert('プロフィールを更新しました');
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('更新中にエラーが発生しました');
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-4 text-gray-500">
        プロフィールが見つかりません。
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">プロフィール</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {isEditing ? 'キャンセル' : '編集'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="名前を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性別
            </label>
            <select
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              体重 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="例: 65.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              BAC計算に使用されます
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            保存
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">メールアドレス</div>
            <div className="font-medium">{profile.user?.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">名前</div>
            <div className="font-medium">{profile.name || '未設定'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">性別</div>
            <div className="font-medium">
              {profile.sex === 'male' ? '男性' : 
               profile.sex === 'female' ? '女性' : '未設定'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">体重</div>
            <div className="font-medium">
              {profile.weight_kg ? `${profile.weight_kg} kg` : '未設定'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
