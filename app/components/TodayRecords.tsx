'use client';

import { useEffect, useState } from 'react';
import { calculateTotalBAC, getBACStatus } from '@/app/lib/bacCalculator';

interface DrinkRecord {
  id: string;
  amount_ml: number | null;
  type: string | null;
  created_at: string;
}

interface Profile {
  weight_kg: number | null;
  sex: string | null;
}

export default function TodayRecords() {
  const [records, setRecords] = useState<DrinkRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bac, setBac] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 今日の記録を取得
      const recordsResponse = await fetch('/api/records?date=today');
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setRecords(recordsData);
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (records.length > 0 && profile) {
      const drinksWithDates = records.map(record => ({
        ...record,
        created_at: new Date(record.created_at)
      }));
      const calculatedBAC = calculateTotalBAC(
        drinksWithDates,
        profile.weight_kg,
        profile.sex
      );
      setBac(calculatedBAC);
    }
  }, [records, profile]);

  const bacStatus = getBACStatus(bac);

  const handleDelete = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const response = await fetch(`/api/records?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(); // データを再取得
        alert('記録を削除しました');
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
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        今日の記録はまだありません。
      </div>
    );
  }

  const totalAmount = records.reduce((sum, record) => {
    return sum + (record.amount_ml || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">今日のサマリー</h3>
          <span className={`text-2xl ${bacStatus.color}`}>{bacStatus.icon}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">合計飲酒量</div>
            <div className="font-bold">{totalAmount} ml</div>
          </div>
          <div>
            <div className="text-gray-500">推定BAC</div>
            <div className="font-bold">{bac.toFixed(3)}%</div>
          </div>
          <div>
            <div className="text-gray-500">状態</div>
            <div className={`font-bold ${bacStatus.color}`}>{bacStatus.description}</div>
          </div>
          <div>
            <div className="text-gray-500">記録数</div>
            <div className="font-bold">{records.length}杯</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold">記録一覧</h3>
        {records.map((record) => (
          <div
            key={record.id}
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">
                {record.type || '未設定'} - {record.amount_ml ? `${record.amount_ml}ml` : '量未設定'}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(record.created_at).toLocaleTimeString('ja-JP')}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.location.href = `/record/${record.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(record.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
