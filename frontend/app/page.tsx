// ① ページ開く
//    ↓
// ② サーバーに接続（socket接続）
//    ↓
// ③ メッセージ受信待ち（on）
//    ↓
// ④ 送信（emit）
//    ↓
// ⑤ サーバー経由で全員に配信
//    ↓
// ⑥ 画面更新

"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { isMapIterator } from "util/types";

//サーバーの住所
const SOCKET_SERVER_URL = "http://localhost:3000";


// アバターの色を名前から生成する
const generateAvatarColor = (name: string) => {
  const colors = [
    "bg-red-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-indigo-400",
    "bg-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState(""); //入力中のテキスト
  const [chatLog, setChatLog] = useState<{ name: string; text: string }[]>([]); //届いたメッセージのリスト(チャット履歴)
  const [socket, setSocket] = useState<Socket | null>(null); //通信機

  useEffect(() => {

    //名前をlocalStorageに残してリロードしても記録する
    const savedName = localStorage.getItem("chat-user-name");
    if (savedName) {
      setUserName(savedName);
    }


    //ページを開いた瞬間にサーバーに接続する
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    //最初にメッセージをまとめて受け取る
    newSocket.on("init_messages", (data: { name: string, text: string }[]) => {
      setChatLog(data);
    });

    //サーバーから 'new_message'　が届いたらリストに追加する
    newSocket.on("new_message", (data: { name: string, text: string }) => {
      setChatLog((prev) => [...prev, data]);
    });

    //ページを閉じたら接続を切る
    return () => {
      newSocket.disconnect();
    };
  }, []);


  //名前が変わった時にlocalStorageに保存
  const handelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setUserName(newName);
    localStorage.setItem("chat-user-name", newName);  //ここでローカルスロレージに保存
  };

  //メッセージ送信処理
  const sendMessage = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    //サーバーに 'send_message' と言う名前で文字を送る
    if (socket && message && userName) {
      socket.emit("send_message", {name: userName, text: message});
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col text-black bg-gray-100 min-h-screen">
      <header className="bg-white p-4 shadow-sm border-b flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-4 text-gray-800">
          リアルタイムチャット
        </h1>
        <div className="flex items-center gap-2">
          {userName && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${generateAvatarColor(userName)}`}
            >
              {userName.substring(0, 1).toUpperCase()}
            </div>
          )}
          <input
            type="text"
            value={userName}
            placeholder="あなたの名前を入力"
            onChange={handelNameChange}
            className="border p-2 block text-black"
          />
        </div>
      </header>

      {/* チャット画面 */}
      <div className="flex-grow p-6 overflow-y-auto space-y-5 bg-gray-100/50">
        {chatLog.map((msg, i) => {
          // 自分か他人かでチャットを左右に分ける
          const isMe = msg.name === userName;
          const avatarColor = generateAvatarColor(msg.name);
          const time = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <div
              key={i}
              className={`flex items-end ${isMe ? "justify-end" : "justify-start"} gap-2`}
            >
              {/* 相手のアバター（自分なら表示しない） */}
              {!isMe && (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${avatarColor}`}
                >
                  {msg.name.substring(0, 1).toUpperCase()}
                </div>
              )}
              {/* 吹き出し：ヒゲと時間を追加 */}
              <div
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none" // 自分の吹き出し（青）
                      : "bg-white text-gray-800 rounded-bl-none border" // 相手の吹き出し（白）
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* 送信時間 */}
                <span className="text-xs text-gray-400 mt-1.5 px-1">
                  {time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="bg-white p-4 shadow-md border-t sticky bottom-0 z-10">
        <div className="flex items-center gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow border p-3 rounded-2xl text-black bg-gray-50 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition placeholder:text-gray-400 resize-none h-12 min-h-[48px] max-h-32"
            placeholder="メッセージを入力..."
            rows={2}
            onKeyDown={(e) => {
              //エンターは改行のみで送信はしない
            }}
          />
          <button
            onClick={() => sendMessage()}
            className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 disabled:bg-gray-300"
            disabled={!message || !userName}
          >
            {/* 紙飛行機のアイコン（svg） */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 -rotate-45 -mr-1"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.94a.75.75 0 00.614.513l8.841 1.591-8.841 1.592a.75.75 0 00-.614.513L2.552 20.65a.75.75 0 00.926.94l18.11-10.217a.75.75 0 000-1.332L3.478 2.405z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
