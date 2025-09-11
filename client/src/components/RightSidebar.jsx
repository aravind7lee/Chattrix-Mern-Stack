// RightSidebar.jsx
import React, { useContext, useMemo, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

/**
 * RightSidebar — responsive & non-blocking
 *
 * - Mobile (< md): NOT fixed; sits **below** ChatContainer and uses h-[20vh]
 *   so it never covers the composer. Tap the "Media • N" row to open a
 *   **mobile-only full-screen gallery** with all shared images.
 *
 * - Desktop (md+): standard right-side panel (md:w-80). The media grid
 *   shows inline as before. No change to desktop UX.
 */
const RightSidebar = () => {
  const chat = useContext(ChatContext) || {};
  const auth = useContext(AuthContext) || {};

  const { selectedUser, messages = [] } = chat;
  const { logout, onlineUsers = [] } = auth;

  const [activeImage, setActiveImage] = useState(null);
  const [showMobileMedia, setShowMobileMedia] = useState(false);

  // collect images for this conversation
  const msgImages = useMemo(() => {
    if (!selectedUser || !Array.isArray(messages)) return [];
    const uid = selectedUser._id;
    return messages
      .filter(
        (m) =>
          m &&
          m.image &&
          (m.senderId === uid ||
            m.receiverId === uid ||
            (Array.isArray(m.participants) && m.participants.includes(uid)))
      )
      .map((m) => m.image)
      .filter(Boolean)
      .reverse();
  }, [messages, selectedUser]);

  if (!selectedUser) return null;

  const profilePic = selectedUser?.profilePic || assets.avatar_icon || assets.logo_icon;
  const fullName = selectedUser?.fullName || "Unknown User";
  const bio = selectedUser?.bio || "";

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = assets.logo_icon || "";
  };

  const joinedDate = (() => {
    try {
      if (!selectedUser?.createdAt) return "—";
      const d = new Date(selectedUser.createdAt);
      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
    } catch {
      return "—";
    }
  })();

  return (
    <>
      {/* MOBILE: stacked under the chat, height = 20vh; DESKTOP: right column panel */}
      <aside
        className="
          w-full md:w-80
          h-[20vh] md:h-auto
          overflow-y-auto
          bg-[#0b0b10]/60 backdrop-blur-md
          border-t border-white/10 md:border-t-0 md:border-l md:border-white/10
          text-white p-4 md:p-6 rounded-t-xl md:rounded-none
          flex-none min-h-0
        "
        aria-label="Right sidebar with profile & media"
      >
        {/* Profile header */}
        <div className="flex flex-col items-center gap-3 text-sm font-light mx-auto">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-white/10">
            <img
              src={profilePic}
              alt={`${fullName} profile`}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>

          <div className="text-center w-full px-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold truncate">{fullName}</h2>
              <span
                title={onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                className={`inline-block w-2 h-2 rounded-full ${
                  onlineUsers.includes(selectedUser._id) ? "bg-green-400" : "bg-neutral-400/60"
                }`}
              />
            </div>
            {bio ? <p className="mt-2 text-sm text-white/70 px-4 line-clamp-2 md:line-clamp-none">{bio}</p> : null}
          </div>
        </div>

        <hr className="border-white/10 my-3" />

        {/* Media row (mobile opens gallery, desktop shows grid inline) */}
        <div className="px-1 text-xs">
          {/* Row header */}
          <button
            type="button"
            onClick={() => setShowMobileMedia(true)}
            className="w-full flex items-center justify-between mb-2 md:cursor-default md:pointer-events-none"
          >
            <p className="text-sm text-white/80 font-medium">Media</p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-white/70">{msgImages.length}</p>
              {/* show chevron only on mobile */}
              <svg
                className="md:hidden w-4 h-4 opacity-80"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>

          {/* Desktop: inline media grid */}
          <div className="hidden md:block">
            {msgImages.length === 0 ? (
              <div className="text-white/60 text-sm py-6 text-center">No media shared.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {msgImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(url)}
                    className="relative rounded-lg overflow-hidden group w-full h-28 focus:outline-none"
                    title="Open image"
                  >
                    <img
                      src={url}
                      alt={`shared-${idx}`}
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-col items-center">
          <div className="w-full text-center text-xs text-white/60 mb-3">
            <p>
              Member since: <span className="font-medium text-white/80">{joinedDate}</span>
            </p>
          </div>

          <button
            onClick={() => (typeof logout === "function" ? logout() : (window.location.href = "/logout"))}
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-medium py-2 px-6 rounded-full shadow-md hover:scale-[1.01] transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ===== Mobile-only full-screen gallery opened from Media row ===== */}
      {showMobileMedia && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/60 border-b border-white/10">
            <button
              onClick={() => setShowMobileMedia(false)}
              className="p-2 rounded-full hover:bg-white/10 active:scale-95"
              aria-label="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414l4.293-4.293a1 1 0 111.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <p className="text-white/90 font-medium">Media • {msgImages.length}</p>
          </div>

          {/* Grid of images */}
          <div className="p-4 overflow-y-auto h-[calc(100vh-56px)]">
            {msgImages.length === 0 ? (
              <div className="text-white/70 text-center mt-14">No media shared yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {msgImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(url)}
                    className="relative rounded-lg overflow-hidden group w-full h-36 focus:outline-none"
                    title="Open image"
                  >
                    <img
                      src={url}
                      alt={`shared-${idx}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = assets.logo_icon || "";
                      }}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox modal (both mobile & desktop) */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="max-w-[92vw] max-h-[92vh] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage}
              alt="Preview"
              className="w-full h-auto max-h-[92vh] object-contain bg-black"
              onError={handleImageError}
            />
          </div>

          <button
            onClick={() => setActiveImage(null)}
            aria-label="Close"
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default RightSidebar;
