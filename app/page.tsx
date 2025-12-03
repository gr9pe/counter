'use client';

import { useEffect, useState, useCallback } from 'react';
import ProfileEditor from './components/ProfileEditor';
import DrinkEditModal from './components/EditModal';
import { calculateTotalBAC, getBACStatus } from './lib/bacCalculator';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DrinkRecord {
  id: string;
  amount_ml: number | null;
  type: string | null;
  created_at: string;
}

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

interface DrinkButtonProps {
  onDrinkRecorded: () => void;
  disabled?: boolean;
}

export default function HomePage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DrinkRecord | null>(null);
  const [records, setRecords] = useState<DrinkRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin'); 
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [recordsResponse, profileResponse] = await Promise.all([
        fetch('/api/records?date=today'),
        fetch('/api/profile')
      ]);

      if (!recordsResponse.ok) {
        throw new Error('記録の取得に失敗しました');
      }
      if (!profileResponse.ok) {
        throw new Error('記録の取得に失敗しました');
      }

      const [recordsData, profileData] = await Promise.all([
        recordsResponse.json(),
        profileResponse.json()
      ]);

      setRecords(recordsData);
      setProfile(profileData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回読み込み
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 記録追加後のハンドラー
  const handleDrinkRecorded = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 記録編集後のハンドラー（BAC再計算のため）
  const handleRecordUpdated = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 記録削除のハンドラー
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const response = await fetch(`/api/records?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '削除に失敗しました');
      }

      await fetchData();
      alert('記録を削除しました');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '削除中にエラーが発生しました';
      alert(errorMessage);
      console.error('Error deleting record:', err);
    }
  }, [fetchData]);

  if (!session) return null;

  return (
    <div className="min-h-screen">
      {/* ナビバー */}
      <nav className="shadow-md p-4 flex justify-between items-center">
        {/* 左側: タイトル */}
        <span className="font-bold text-lg">酒</span>
        
        {/* 右側: ボタン群をまとめるコンテナを追加 */}
        <div className="flex items-center space-x-4">
          
          {/* ログアウトボタン (セッションがある場合のみ) */}
          {session && ( 
            <button
              onClick={() => {signOut();}}
              className="text-red-500 font-semibold hover:underline text-sm"
            >
              ログアウト
            </button>
          )}
          
          {/* プロフィールボタン */}
          <button
            onClick={() => setIsProfileOpen(true)}
            // プロフィールボタンは視認性を保つため、少し大きいテキストサイズを維持しても良い
            className="text-blue-600 font-semibold hover:underline"
          >
            プロフィール
          </button>
        </div>
      </nav>

      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 上部ボタン */}
        <div className="sticky top-4 z-10">
          <DrinkButton 
            onDrinkRecorded={handleDrinkRecorded}
            disabled={isLoading}
          />
        </div>

        {/* 今日の記録 */}
        <div className="rounded-2xl shadow-md p-4">
          <TodayRecords 
            records={records}
            profile={profile}
            isLoading={isLoading}
            onDelete={handleDelete}
            onEdit={setEditingRecord}
          />
        </div>

        {/* プロフィールモーダル */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center
                      bg-neutral-900/40 dark:bg-neutral-900/60 backdrop-blur-sm"
            onClick={() => setIsProfileOpen(false)}   // 背景クリックで閉じる
          >
            <div
              className="rounded-2xl shadow-lg w-full max-w-md p-6 relative
                        max-h-[90vh] overflow-y-auto
                        bg-white dark:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}    // 内側クリックを止める
            >
          <button
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 
                      dark:text-gray-50 dark:hover:text-white text-xl"
          >
            ✕
          </button>

          <ProfileEditor />
        </div>
  </div>
)}


        {/* 記録編集モーダル */}
        {editingRecord && (
          <DrinkEditModal
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onUpdate={handleRecordUpdated}
          />
        )}
      </main>
    </div>
  );
}

function DrinkButton({ onDrinkRecorded, disabled }: DrinkButtonProps) {
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
          amount_ml: null,
          type: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '記録に失敗しました');
      }

      onDrinkRecorded();
      alert('1杯記録しました！種類と量を編集してください。');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '記録中にエラーが発生しました';
      alert(errorMessage);
      console.error('Error recording drink:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleQuickDrink}
      disabled={isLoading || disabled}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '記録中...' : '1杯飲んだ！'}
    </button>
  );
}

interface TodayRecordsProps {
  records: DrinkRecord[];
  profile: Profile | null;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit: (record: DrinkRecord) => void;
}

function TodayRecords({ records, profile, isLoading, onDelete, onEdit }: TodayRecordsProps) {
  const [bac, setBac] = useState(0);

  // BAC計算をメモ化
  useEffect(() => {
    if (records.length > 0 && profile?.weight_kg && profile?.sex) {
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
    } else {
      setBac(0);
    }
  }, [records, profile]);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        今日の記録はまだありません。<br />
        「1杯飲んだ！」ボタンで記録を始めましょう。
      </div>
    );
  }

  const bacStatus = getBACStatus(bac);
  const totalAmount = records.reduce((sum, record) => {
    const amount = Number(record.amount_ml) || 0;
    return sum + amount;
  }, 0);


  return (
    <div className="space-y-4">
      {/* サマリーカード */}
      <div className="bg-gradient-to-br from-green-200 to-purple-500 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">今日のサマリー</h3>
          <span className={`text-3xl ${bacStatus.color}`}>{bacStatus.icon}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-800">合計飲酒量</div>
            <div className="font-bold text-lg">{totalAmount} ml</div>
          </div>
          <div>
            <div className="text-gray-800">推定BAC</div>
            <div className="font-bold text-lg">{bac.toFixed(3)}%</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-800">状態</div>
            <div className={`font-bold ${bacStatus.color}`}>{bacStatus.description}</div>
          </div>
          <div>
            <div className="text-gray-800">記録数</div>
            <div className="font-bold text-lg">{records.length}杯</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <SummaryShareButton
            recordsCount={records.length}
            bac={bac}
          />
        </div>
      </div>

      {/* 記録一覧 */}
      <div className="space-y-2">
        <h3 className="font-bold">記録一覧</h3>
        {records.map((record) => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:bg-gray-800 transition-colors"
          >
            <div className="flex-1">
              <div className="font-medium">
                {record.type || '未設定'} - {record.amount_ml ? `${record.amount_ml}ml` : '量未設定'}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(record.created_at).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(record)}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium px-2 py-1"
              >
                編集
              </button>
              <button
                onClick={() => onDelete(record.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
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


function openTweet(text: string) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// 市区町村だけ取る（Nominatim）
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    const addr = data.address;
    return (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      null
    );
  } catch {
    return null;
  }
}

export function SummaryShareButton({
  recordsCount,
  bac,
}: {
  recordsCount: number;
  bac: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleShare = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const location = await reverseGeocode(latitude, longitude);

        const tweetText = `今日は${location}で${recordsCount}杯飲みました！現在の推定BACは${bac.toFixed(3)}%です！`;

        openTweet(tweetText);
        setLoading(false);
      },
      () => {
        // 位置取得拒否 or エラー
        const tweetText = [
          `今日は位置情報の取得できない状況で${recordsCount}杯飲みました！現在の推定BACは${bac.toFixed(3)}%です！`,
        ].join("\n");

        openTweet(tweetText);
        setLoading(false);
      }
    );
  };

  return (
    <button
      onClick={handleShare}
      className="text-sm text-blue-500 hover:text-blue-700 underline"
      disabled={loading}
    >
      {loading ? "取得中..." : "Twitterで共有"}
    </button>
  );
}