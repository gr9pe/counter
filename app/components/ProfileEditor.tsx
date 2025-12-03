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
  if (!isLoading) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名前</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">性別</label>
            <select
              value={formData.sex}
              onChange={(e) =>
                setFormData({ ...formData, sex: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight_kg}
              onChange={(e) =>
                setFormData({ ...formData, weight_kg: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            保存
          </button>
        </form>
    );
  }
}
