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

  const fetchRecords = useCallback(async () => {
    try {
      const recordsResponse = await fetch('/api/records?date=today');

      if (!recordsResponse.ok) {
        throw new Error('記録の取得に失敗しました');
      }

      const recordsData: DrinkRecord[] = await recordsResponse.json();
      setRecords(recordsData);
      setError(null); // 記録取得成功時はエラーをクリア
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      console.error('Error fetching records:', err);
    }
  }, []);
  
  // プロフィールデータのみを取得する関数 (初回のみ)
  const fetchProfile = useCallback(async () => {
    try {
      const profileResponse = await fetch('/api/profile');

      if (!profileResponse.ok) {
        // プロフィールがない/エラーの場合、セットせずに終了
        if (profileResponse.status !== 404) {
             throw new Error('プロフィール情報の取得に失敗しました');
        }
        setProfile(null);
        return;
      }

      const profileData: Profile = await profileResponse.json();
      setProfile(profileData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      console.error('Error fetching profile:', err);
    }
  }, []);


  // 初回読み込み: プロフィールと記録を並列で取得
  useEffect(() => {
    const initialLoad = async () => {
        if (status === 'authenticated') {
            setIsLoading(true);
            await Promise.all([fetchProfile(), fetchRecords()]);
            setIsLoading(false);
        }
    };
    initialLoad();
  }, [fetchProfile, fetchRecords, status]);

  // 記録追加後のハンドラー: 記録を再取得
  const handleDrinkRecorded = useCallback(() => {
    fetchRecords();
    // 記録APIは新しく追加された記録IDを返すように変更し、
    // それを使ってローカルのrecordsを更新できれば、fetchRecordsも不要になります。
    // 今回は記録APIの変更がない前提でfetchRecordsを呼び出します。
  }, [fetchRecords]);

  // 記録編集後のハンドラー: 記録を再取得
  const handleRecordUpdated = useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 記録削除のハンドラー: ローカルの状態を更新する
  const handleDelete = useCallback(async (id: string) => {

    try {
      const response = await fetch(`/api/records?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '削除に失敗しました');
      }
      
      // BAC再計算のために、ローカルの状態を更新するだけでAPIコールはしない
      setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '削除中にエラーが発生しました';
      alert(errorMessage);
      console.error('Error deleting record:', err);
    }
  }, []);
  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ナビバー */}
      <nav className="shadow-md p-4 flex justify-between items-center 
                    w-full z-20 bg-white dark:bg-neutral-900 sticky top-0">
        {/* 左側: タイトル */}
        <span className="font-bold text-lg">🍺</span>
        
        {/* 右側: ボタン群をまとめるコンテナを追加 */}
        <div className="flex items-center space-x-4">
          
          {/* ログアウトボタン (セッションがある場合のみ) */}
          {session && ( 
            <button
              onClick={() => {signOut();}}
              className="text-red-700 font-semibold hover:underline text-sm"
            >
              ログアウト
            </button>
          )}
          
          {/* プロフィールボタン */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="text-700 font-semibold hover:underline text-sm"
          >
            プロフィール
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start py-4">
        <div className="w-full max-w-md px-4 space-y-6">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 上部ボタン */}
          <div className="z-10">
            <DrinkButton 
              onDrinkRecorded={handleDrinkRecorded}
              disabled={isLoading}
            />
          </div>

          {/* 今日の記録 */}
          <div className="rounded-2xl shadow-md p-4 dark:bg-neutral-800">
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
          </div>)}
      </div>
    


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
          amount_ml: 500,
          type: "beer",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '記録に失敗しました');
      }

      onDrinkRecorded();
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
      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        今日の記録はまだありません。
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
      <div className={`p-5 rounded-2xl transition-all duration-300
            // 背景色をシンプルに白/暗いグレーにし、BACに応じて目立つボーダーを適用
            bg-white dark:bg-neutral-800
            // BAC状態の説明に色を移譲するため、古いグラデーションを削除
            `}>
    
          {/* ヘッダー: タイトルとアイコン */}
          <div className="flex justify-between items-start mb-4">
              <h3 className="font-extrabold text-2xl 
                            text-gray-900 dark:text-white flex items-center">
                  今日のサマリ
              </h3>
              {/* アイコンは引き続きBAC Statusの色を使用 */}
              <span className={`text-4xl ${bacStatus.color}`}>{bacStatus.icon}</span>
          </div>

          {/* BAC状態の強調表示 */}
          <div className={`text-center py-3 px-2 rounded-lg mb-4
                          font-bold text-lg 
                          bg-opacity-10 dark:bg-opacity-20`}>
              <span className="block text-xs font-normal 
                              text-gray-700 dark:text-gray-300 mb-1">推定状態</span>
              {/* 状態の説明 */}
              {bacStatus.description}
          </div>

          {/* 詳細データ (グリッド) */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
              
              {/* 推定BAC */}
              <div className="col-span-1 border-r border-gray-200 dark:border-neutral-700">
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">推定BAC</div>
                  <div className="font-extrabold text-xl 
                                  text-gray-900 dark:text-white">
                      {bac.toFixed(3)}<span className="text-sm">%</span>
                  </div>
              </div>
              
              {/* 合計飲酒量 */}
              <div className="col-span-1 border-r border-gray-200 dark:border-neutral-700">
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">合計飲酒量</div>
                  <div className="font-bold text-xl 
                                  text-gray-900 dark:text-white">
                      {totalAmount} <span className="text-sm">ml</span>
                  </div>
              </div>

              {/* 記録数 */}
              <div className="col-span-1">
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">記録数</div>
                  <div className="font-bold text-xl 
                                  text-gray-900 dark:text-white">
                      {records.length} <span className="text-sm">杯</span>
                  </div>
              </div>
          </div>
          
          {/* 共有ボタン */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-neutral-700 flex justify-center">
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
            className="border border-gray-200 rounded-lg p-3 flex justify-between items-center 
                      hover:bg-gray-50 transition-colors 
                      dark:border-neutral-700 dark:bg-neutral9900 dark:hover:bg-neutral-800" // ダークモード対応
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white"> {/* テキストをテーマ対応 */}
                {record.type || '未設定'} - {record.amount_ml ? `${record.amount_ml}ml` : '量未設定'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400"> {/* 時刻表示をテーマ対応 */}
                {new Date(record.created_at).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(record)}
                // 編集ボタンをページのテーマカラー（紫）に統一し、ダークモードに対応
                className="text-500 hover:text-natural-700 text-sm font-medium px-2 py-1 
                          dark:text-natural-400 dark:hover:text-natural-300" 
              >
                編集
              </button>
              <button
                onClick={() => onDelete(record.id)}
                // 削除ボタンをダークモードに対応
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 
                          dark:text-red-400 dark:hover:text-red-300"
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

        const tweetText = `今日は${location}で${recordsCount}杯飲みました！現在の推定BACは${bac.toFixed(3)}%です`;

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
      disabled={loading}
      // 以前のスタイル: text-sm text-blue-500 hover:text-blue-700 underline
      
      // 新しいスタイル: 紫のアウトラインボタン (Twitterブルーではなくアプリのテーマカラーを使用)
      className="text-sm font-semibold border border-purple-300 text-purple-300 
                py-1 px-3 rounded-full 
                hover:bg-purple-50 transition-colors 
                disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "取得中..." : "ツイート"}
    </button>
  );
}