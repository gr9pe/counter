import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DrinkButton from "./components/DrinkButton";
import TodayRecords from "./components/TodayRecords";
import ProfileEditor from "./components/ProfileEditor";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">飲酒量管理アプリ</h1>
          <p className="text-gray-600 mt-1">今日の飲酒を記録してBACを計算</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">今すぐ記録</h2>
          <p className="text-gray-600 text-sm mb-4">
            飲んでいる最中でも使えるよう、最小 1 タップで記録可能
          </p>
          <DrinkButton onDrinkRecorded={() => window.location.reload()} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <TodayRecords />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <ProfileEditor />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">X（旧Twitter）に投稿</h2>
          <p className="text-gray-600 text-sm mb-4">
            今日の記録をXに投稿できます
          </p>
          <button
            onClick={() => {
              const text = encodeURIComponent(
                `今日の飲酒記録を記録しました！ #飲酒管理アプリ`
              );
              window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
            }}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            今日の記録を投稿
          </button>
        </div>

        <footer className="text-center text-gray-500 text-sm pt-4">
          <p>BAC計算はWidmark公式に基づいています</p>
          <p className="mt-1">※このアプリは飲酒運転を推奨するものではありません</p>
        </footer>
      </div>
    </main>
  );
}
