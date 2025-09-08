import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

const SideBar = () => {
  const chat = useContext(ChatContext) || {};
  const auth = useContext(AuthContext) || {};

  const {
    getUsers,
    users = [],
    selectedUser,
    setSelectedUser,
    unseenMessages = {},
    getMessages,
    setUnseenMessages
  } = chat;

  const { logout, onlineUsers = [] } = auth;

  const [input, setInput] = useState("");
  const navigate = useNavigate();

  // fetch users on mount and when online list changes (throttled)
  const lastFetchAt = useRef(0);
  useEffect(() => {
    const run = async () => {
      const now = Date.now();
      if (now - lastFetchAt.current < 1200) return;
      lastFetchAt.current = now;
      if (typeof getUsers === "function") await getUsers();
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineUsers, unseenMessages]);

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const q = (input || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => ((u?.fullName ?? "").toString().toLowerCase()).includes(q));
  }, [users, input]);

  const handleUserClick = async (user) => {
    if (typeof setSelectedUser === "function") {
      setSelectedUser(user);
    }
    
    // Clear unseen count for this user immediately when clicked
    if (typeof setUnseenMessages === "function" && user?._id) {
      setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
    }
    
    // Fetch messages for this user
    if (typeof getMessages === "function" && user?._id) {
      await getMessages(user._id);
    }
  };

  return (
    <div
      className={`h-full p-5 rounded-r-xl overflow-y-auto text-white ${
        selectedUser ? "max-md:hidden" : ""
      } bg-gradient-to-b from-slate-900/30 to-black/30 backdrop-blur-xl border-r border-white/10`}
    >
      {/* Header */}
      <div className="pb-5 sticky top-0 z-20 bg-transparent">
        <div className="flex items-center justify-between">
          <img src={assets.logo || assets.logo_icon} alt="logo" className="w-40 h-auto" />

          {/* Menu */}
          <div className="relative group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="h-5 w-5 cursor-pointer opacity-90 hover:opacity-100 transition"
            />

            <div className="absolute top-10 right-0 z-30 w-44 rounded-xl bg-slate-900/95 backdrop-blur-md shadow-lg border border-white/10 flex flex-col py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={() => navigate("/profile")}
                className="text-sm px-4 py-2 text-left text-white/80 hover:text-white hover:bg-indigo-500/20 transition rounded-md cursor-pointer"
              >
                Edit Profile
              </button>

              <button
                onClick={() => (typeof logout === "function" ? logout() : null)}
                className="text-sm px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition rounded-md cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 flex items-center gap-2 py-3 px-4 rounded-full bg-white/5 ring-1 ring-white/10 focus-within:ring-indigo-400/60 transition">
          <img src={assets.search_icon} alt="Search" className="w-4 h-4 opacity-80" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-white text-sm placeholder-white/60 flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      {/* Users */}
      <div className="flex flex-col gap-1">
        {filteredUsers.map((user, index) => {
          const id = user?._id;
          const isSelected = selectedUser?._id === id;
          const isOnline = Array.isArray(onlineUsers) && id ? onlineUsers.includes(id) : false;
          const unread = unseenMessages?.[id] || 0;

          return (
            <div
              key={id || index}
              onClick={() => handleUserClick(user)}
              className={`relative flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition ${
                isSelected ? "bg-indigo-500/15 ring-1 ring-indigo-400/30" : "hover:bg-white/5"
              }`}
            >
              <div className="relative">
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-slate-900"></span>
                )}
              </div>

              <div className="flex flex-col leading-5 min-w-0 flex-1">
                <p className="truncate font-medium">{user?.fullName || "Unknown user"}</p>
                <p className="text-xs text-neutral-400 truncate">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              {unread > 0 ? (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-violet-600/80 text-white ring-1 ring-white/20">
                    {unread > 99 ? "99+" : unread}
                  </span>
                </div>
              ) : (
                <span className="w-5"></span> // Spacer to maintain alignment
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-sm text-white/60 px-4 py-6 text-center">
            {input ? "No users found" : "No users available"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;