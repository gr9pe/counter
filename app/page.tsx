'use client';

import { useEffect, useState } from 'react';

interface Record {
  id: string;
  drank_at: string;
  type?: string | null;
  amount_ml?: number | null;
}

export default function HomePage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    const res = await fetch('/api/records?date=today');
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleQuickDrink = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: null, type: null }),
      });
      if (!res.ok) throw new Error('記録失敗');
      const newRecord = await res.json();
      // 成功時に state に追加 → 自動で UI 更新
      setRecords((prev) => [newRecord, ...prev]);
    } catch (err) {
      alert('記録中にエラーが発生しました');
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6">
      <button
        onClick={handleQuickDrink}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg text-lg"
      >
        {loading ? '記録中...' : '1杯飲んだ！'}
      </button>

      <section>
        {records.length === 0 ? (
          <p>まだ記録がありません</p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id} className="border rounded-md p-3 flex justify-between">
                <span>{new Date(r.drank_at).toLocaleTimeString()}</span>
                <span>{r.type || '-'}</span>
                <span>{r.amount_ml ?? '-' } ml</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
