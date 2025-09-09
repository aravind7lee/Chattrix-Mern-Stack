// Sidebar.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import toast from "react-hot-toast";

const Sidebar = () => {
  const {
    getUsers,
    users = [],
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  // logout from AuthContext (expects the improved logout that returns a Promise)
  const { logout, onlineUsers = [] } = useContext(AuthContext);

  // local UI state
  const [input, setInput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // blocks menu actions while processing

  // responsive flags for behaviour (mobile vs desktop)
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 420 : false
  );
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // Search filter for users
  const q = (input || "").trim().toLowerCase();
  const filteredUsers = q
    ? users.filter((user) => user.fullName.toLowerCase().includes(q))
    : users;

  // keep user list updated whenever onlineUsers changes
  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineUsers]);

  // responsive resize handler
  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      setIsNarrow(w <= 420);
      setIsDesktop(w >= 768);
      if (w >= 768) setIsMenuOpen(false); // ensure mobile menu closed on desktop
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // close menu when clicking/touching outside or pressing Escape
  useEffect(() => {
    function handleOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
  };

  /**
   * Navigate to profile quickly:
   * - prevent event propagation
   * - close menu immediately
   * - navigate immediately to /profile (fast perceived transition)
   * - show a short loading toast for UX while profile page fetches its data
   */
  const handleNavigateProfile = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    if (actionLoading) return;

    setActionLoading(true);
    setIsMenuOpen(false);

    // immediate SPA navigation (fast)
    try {
      navigate("/profile");
    } catch (err) {
      console.error("navigate error:", err);
    }

    // show a brief loading toast so user sees feedback while the profile loads
    const id = toast.loading("Opening profile...");
    // Dismiss after a short time (or you could dismiss from profile page when it's done fetching)
    setTimeout(() => {
      toast.dismiss(id);
      toast.success("Opening profile");
      setActionLoading(false);
    }, 800);
  };

  /**
   * Logout robustly:
   * - prevent event propagation
   * - show loading toast and inline spinner
   * - await logout(...) from AuthContext (we pass redirect:false so Sidebar controls navigation)
   * - after success, navigate to /login via React Router
   */
  const handleLogout = async (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    if (actionLoading) return;

    setActionLoading(true);
    const toastId = toast.loading("Logging out...");

    try {
      // call logout from context; pass { redirect: false } to avoid context redirect
      // (your updated AuthContext supports this options object).
      await logout?.({ redirect: false });

      toast.dismiss(toastId);
      toast.success("Logged out");

      // close any open menu UI
      setIsMenuOpen(false);

      // navigate using SPA router so the app doesn't hard-reload unless your logic needs that
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("logout error:", err);
      toast.dismiss(toastId);
      toast.error("Logout failed. Try again.");
    } finally {
      // small delay to avoid instant re-enable flicker
      setTimeout(() => setActionLoading(false), 300);
    }
  };

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          {/* Menu wrapper */}
          <div className="relative py-2 group">
            <button
              type="button"
              ref={menuBtnRef}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              onClick={() => {
                if (!isDesktop) setIsMenuOpen((s) => !s);
              }}
              onKeyDown={(e) => {
                if (!isDesktop) {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsMenuOpen((s) => !s);
                  } else if (e.key === "Escape") {
                    setIsMenuOpen(false);
                  }
                }
              }}
              className="p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400/40 flex items-center gap-2"
              title="Menu"
              aria-label="Open menu"
            >
              <img src={assets.menu_icon} alt="Menu" className="max-h-5 cursor-pointer" />
              {/* chevron for mobile toggle */}
              {!isDesktop && (
                <svg
                  className={`inline-block w-3 h-3 transform transition-transform duration-200 ${
                    isMenuOpen ? "rotate-180" : "rotate-0"
                  } opacity-80`}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Desktop hover dropdown (md+) */}
            <div
              ref={menuRef}
              className="absolute top-full right-0 z-50 w-40 p-3 rounded-md bg-[#282142] border border-gray-600 text-gray-100 shadow-lg hidden md:group-hover:block opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
              role="menu"
              aria-label="Profile menu"
            >
              <button
                type="button"
                onClick={handleNavigateProfile}
                className="w-full text-left text-sm py-2 px-1 rounded hover:bg-white/5 transition flex items-center justify-between"
                role="menuitem"
                tabIndex={0}
                disabled={actionLoading}
                aria-busy={actionLoading}
              >
                <span>Edit profile</span>
                {actionLoading && (
                  <svg className="w-4 h-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <hr className="my-2 border-t border-gray-500" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left text-sm py-2 px-1 rounded hover:bg-white/5 transition flex items-center justify-between"
                role="menuitem"
                tabIndex={0}
                disabled={actionLoading}
                aria-busy={actionLoading}
              >
                <span>Logout</span>
                {actionLoading && (
                  <svg className="w-4 h-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile dropdown (non-very-narrow) */}
            <div
              className={`absolute top-full right-0 z-50 w-44 p-2 rounded-md bg-[#282142] border border-gray-600 text-gray-100 shadow-lg md:hidden
                transform transition-all duration-220 origin-top-right
                ${isMenuOpen && !isNarrow ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}
              `}
              style={{ willChange: "transform, opacity" }}
              role="menu"
              aria-label="Mobile dropdown"
            >
              {!isNarrow && (
                <>
                  <button
                    type="button"
                    onClick={handleNavigateProfile}
                    className="w-full text-left text-sm py-2 px-2 rounded hover:bg-white/5 transition flex items-center justify-between"
                    role="menuitem"
                    tabIndex={0}
                    disabled={actionLoading}
                    aria-busy={actionLoading}
                  >
                    <span>Edit profile</span>
                    {actionLoading && <svg className="w-4 h-4 animate-spin text-white/80" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>}
                  </button>

                  <hr className="my-2 border-t border-gray-500" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left text-sm py-2 px-2 rounded hover:bg-white/5 transition flex items-center justify-between"
                    role="menuitem"
                    tabIndex={0}
                    disabled={actionLoading}
                    aria-busy={actionLoading}
                  >
                    <span>Logout</span>
                    {actionLoading && <svg className="w-4 h-4 animate-spin text-white/80" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>}
                  </button>
                </>
              )}
            </div>

            {/* VERY NARROW bottom-sheet */}
            {isNarrow && (
              <>
                <div
                  ref={overlayRef}
                  className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                  aria-hidden={!isMenuOpen}
                  onClick={() => setIsMenuOpen(false)}
                />

                <div
                  className={`fixed left-0 right-0 bottom-0 z-50 bg-[#1f1830] border-t border-[rgba(255,255,255,0.04)] shadow-2xl rounded-t-xl px-4 py-4 transition-transform duration-300 ${isMenuOpen ? "translate-y-0" : "translate-y-full"}`}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="mx-auto max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white">Account</div>
                        <div className="text-xs text-white/60">Quick actions</div>
                      </div>
                      <button type="button" onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition" aria-label="Close">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handleNavigateProfile}
                        className="w-full text-left bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] text-white rounded-lg py-3 px-3 transition flex items-center justify-between"
                        disabled={actionLoading}
                        aria-busy={actionLoading}
                      >
                        <span>Edit profile</span>
                        {actionLoading && <svg className="w-4 h-4 animate-spin text-white/80" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>}
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg py-3 px-3 transition flex items-center justify-center"
                        disabled={actionLoading}
                        aria-busy={actionLoading}
                      >
                        {actionLoading ? (
                          <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
                              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <span>Logging out...</span>
                          </div>
                        ) : (
                          <span>Logout</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
            aria-label="Search users"
          />
        </div>
      </div>

      {/* Users list */}
      <div className="flex flex-col mt-4">
        {filteredUsers.map((user, index) => (
          <div
            key={user._id || index}
            onClick={() => handleSelectUser(user)}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
              selectedUser?._id === user._id ? "bg-[#282142]/50" : ""
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSelectUser(user);
            }}
            aria-label={`Open chat with ${user.fullName}`}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt={`${user.fullName} avatar`}
              className="w-[35px] aspect-[1/1] rounded-full object-cover"
            />
            <div className="flex flex-col leading-5 min-w-0">
              <p className="truncate">{user.fullName}</p>
              {onlineUsers.includes(user._id) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>

            {unseenMessages?.[user._id] > 0 && (
              <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Ensure hover-only menu doesn't render on small screens */}
      <style>{`
        @media (max-width: 767px) {
          .group-hover\\:block { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
