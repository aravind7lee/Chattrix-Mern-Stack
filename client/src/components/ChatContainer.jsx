// ChatContainer.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages = [], selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext) || {};
  const { authUser = {}, onlineUsers = [] } = useContext(AuthContext) || {};

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollEnd = useRef();

  // simulate skeleton load
  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 700);
      return () => clearTimeout(t);
    } else {
      setIsLoading(false);
    }
  }, [selectedUser]);

  // fetch messages when user changes
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  // auto-scroll when messages update
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // send text
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // send image
  const handleSendImage = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select an image file");
      if (e.target) e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const isOnline = (id) => Array.isArray(onlineUsers) && onlineUsers.includes(id);

  // ✅ FIX: sort messages by createdAt timestamp
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // no user selected
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-gray-400 bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-lg h-full rounded-2xl p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-8 rounded-2xl shadow-md max-w-md text-center">
          <img src={assets.logo_icon} alt="logo" className="w-20 h-20 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-semibold text-white mb-1">Chat App</h2>
          <p className="text-sm text-white/70">Select a conversation to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-hidden relative bg-gradient-to-br from-[rgba(255,255,255,0.12)] to-[rgba(255,255,255,0.03)] backdrop-blur-lg border-l border-[rgba(255,255,255,0.06)] rounded-r-2xl"
      aria-live="polite"
    >
      {/* HEADER */}
      <header className="flex items-center gap-4 p-4 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-transparent sticky top-0 z-30">
        <div className="relative">
          {isLoading ? (
            <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.04)] animate-pulse" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-purple-400 to-violet-600">
                <div className="bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden w-full h-full">
                  <img
                    src={selectedUser.profilePic || assets.avatar_icon}
                    alt={`${selectedUser.fullName} avatar`}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = assets.avatar_icon;
                    }}
                  />
                </div>
              </div>
              {isOnline(selectedUser._id) && (
                <span className="absolute -right-0 -bottom-0 w-3.5 h-3.5 rounded-full ring-2 ring-white bg-green-400" />
              )}
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <>
              <div className="h-4 w-40 bg-[rgba(255,255,255,0.03)] rounded-md animate-pulse mb-2" />
              <div className="h-3 w-28 bg-[rgba(255,255,255,0.02)] rounded-md animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white truncate">
                  {selectedUser.fullName}
                </h3>
                {isOnline(selectedUser._id) ? (
                  <span className="text-xs text-green-300 bg-green-900/10 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                ) : (
                  <span className="text-xs text-white/60">Offline</span>
                )}
              </div>
              <p className="text-xs text-white/70 truncate max-w-[28rem]">
                {selectedUser.bio || "No status available"}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hidden md:inline-flex p-2 rounded-full hover:bg-[rgba(255,255,255,0.04)] transition"
            title="Help"
            aria-label="Help"
          >
            <img src={assets.help_icon} alt="help" className="w-5 h-5 opacity-90" />
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-2 rounded-full hover:bg-[rgba(255,255,255,0.04)] transition"
            title="Back"
            aria-label="Back"
          >
            <img src={assets.arrow_icon} alt="back" className="w-5 h-5 opacity-90" />
          </button>
        </div>
      </header>

      {/* MESSAGES */}
      <main className="h-[calc(100%-140px)] overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          // skeletons
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => {
              const isRight = i % 2 === 0;
              return (
                <div key={i} className={`flex items-end gap-3 ${isRight ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse ${isRight ? "rounded-br-md" : "rounded-bl-md"}`} />
                </div>
              );
            })}
          </div>
        ) : sortedMessages.length > 0 ? (
          sortedMessages.map((msg, index) => {
            const isOwn = msg.senderId === authUser._id;
            return (
              <div key={index} className={`flex items-end gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
                {/* avatar for receiver */}
                {!isOwn && (
                  <div className="flex flex-col items-center space-y-1 w-[44px]">
                    <img
                      src={selectedUser?.profilePic || assets.avatar_icon}
                      alt={`${selectedUser.fullName} avatar`}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-white/5"
                    />
                    <span className="text-[10px] text-white/60">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                )}

                {/* text or image */}
                {msg.image ? (
                  <div
                    className={`rounded-2xl overflow-hidden mb-4 shadow-sm ${isOwn ? "ml-auto" : ""}`}
                    style={{ maxWidth: 360 }}
                  >
                    <img
                      src={msg.image}
                      alt={`shared-${index}`}
                      className="w-[360px] h-full object-cover block"
                      onClick={() => window.open(msg.image, "_blank")}
                    />
                  </div>
                ) : (
                  <div
                    className={`max-w-[72%] md:max-w-[60%] rounded-2xl p-3 text-sm break-words mb-4 ${
                      isOwn
                        ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-br-none"
                        : "bg-[rgba(255,255,255,0.03)] text-white rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {/* avatar for own */}
                {isOwn && (
                  <div className="flex flex-col items-center space-y-1 w-[44px]">
                    <img
                      src={authUser?.profilePic || assets.avatar_icon}
                      alt="you avatar"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-white/5"
                    />
                    <span className="text-[10px] text-white/60">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // empty state
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="p-6 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]">
              <img src={assets.logo_icon} alt="logo" className="w-16 mx-auto mb-3 opacity-90" />
              <h4 className="text-lg font-medium text-white mb-1">Start a conversation</h4>
              <p className="text-sm text-white/70 text-center max-w-sm">
                Send a message or share an image to begin chatting with <strong>{selectedUser.fullName}</strong>.
              </p>
            </div>
          </div>
        )}

        <div ref={scrollEnd} />
      </main>

      {/* COMPOSER */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[rgba(0,0,0,0.25)] to-transparent border-t border-[rgba(255,255,255,0.03)]">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[rgba(255,255,255,0.03)] px-3 py-2 rounded-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
            />
            <input onChange={handleSendImage} type="file" id="image" accept="image/*" hidden />
            <label htmlFor="image" className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
              <img src={assets.gallery_icon} alt="attach" className="w-5 h-5 opacity-90" />
            </label>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-violet-600 shadow-lg hover:scale-105 disabled:opacity-60"
          >
            <img src={assets.send_button} alt="send" className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 999px; }
      `}</style>
    </div>
  );
};

export default ChatContainer;
