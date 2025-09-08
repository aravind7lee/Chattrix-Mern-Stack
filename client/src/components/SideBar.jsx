import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState(false);

  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`bg-[#818582]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white
    ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* Header */}
      <div className="pb-5 sticky top-0 z-20 bg-transparent">
        <div className="flex items-center justify-between">
          <img
            src={assets.logo || assets.logo_icon}
            alt="logo"
            className="w-40 h-auto"
          />

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
          <img
            src={assets.search_icon}
            alt="Search"
            className="w-4 h-4 opacity-80"
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-white text-sm placeholder-white/60 flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      <div className="flex flex-col">
        {filteredUsers.map((user, index) => (
          <div
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            key={index}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm
            ${selectedUser?._id === user._id && "bg-[#282142]/50"}`}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt=""
              className="w-[35px] aspect-[1/1] rounded-full"
            />

            <div className="flex flex-col">
              <p>{user.fullName}</p>
              {onlineUsers.includes(user._id) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>
            {unseenMessages[user._id] > 0 && (
              <p
                className="absolute top-4 right-4 text-xs h-5 w-5
                flex justify-center items-center rounded-full bg-violet-500/50"
              >
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
