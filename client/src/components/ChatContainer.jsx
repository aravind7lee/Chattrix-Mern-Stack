import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const chat = useContext(ChatContext) || {};
  const auth = useContext(AuthContext) || {};

  const {
    messages = [],
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    isLoading,
    setUnseenMessages
  } = chat;

  const { authUser = {}, onlineUsers = [], socket } = auth;

  const containerRef = useRef(null);
  const prevLenRef = useRef(0);
  const [input, setInput] = useState("");
  const [expandedImage, setExpandedImage] = useState(null);
  const [hoveredImage, setHoveredImage] = useState(null);

  // Load messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    
    (async () => {
      try {
        if (typeof getMessages === "function") await getMessages(selectedUser._id);
        requestAnimationFrame(() => {
          const c = containerRef.current;
          if (c) c.scrollTo({ top: c.scrollHeight, behavior: "auto" });
        });
        prevLenRef.current = 0;
      } catch (err) {
        toast.error("Failed to load messages");
      }
    })();
  }, [selectedUser, getMessages]);

  // Smart auto-scroll when new messages append
  useEffect(() => {
    const c = containerRef.current;
    if (!c) {
      prevLenRef.current = messages.length;
      return;
    }

    const prevLen = prevLenRef.current || 0;
    const currLen = messages.length;
    const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    const nearBottomThreshold = 160;

    if (prevLen === 0 || currLen < prevLen) {
      c.scrollTo({ top: c.scrollHeight, behavior: "auto" });
    } else if (currLen > prevLen) {
      if (distanceFromBottom < nearBottomThreshold) {
        c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
      }
    }

    prevLenRef.current = currLen;

    const imgs = c.querySelectorAll("img");
    const onImgLoad = () => {
      const dist = c.scrollHeight - c.scrollTop - c.clientHeight;
      if (dist < nearBottomThreshold) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    };
    imgs.forEach((img) => img.addEventListener("load", onImgLoad));
    return () => imgs.forEach((img) => img.removeEventListener("load", onImgLoad));
  }, [messages]);

  // Mark messages as read when chat is active and messages change
  useEffect(() => {
    if (selectedUser && messages.length > 0 && socket && setUnseenMessages) {
      // Find unread messages from this user
      const unreadMessages = messages.filter(
        msg => msg.senderId === selectedUser._id && !msg.seen
      );
      
      if (unreadMessages.length > 0) {
        // Clear unseen count for this user
        setUnseenMessages(prev => ({ ...prev, [selectedUser._id]: 0 }));
        
        // Mark messages as read via socket
        unreadMessages.forEach(msg => {
          socket.emit("markAsRead", { 
            messageId: msg._id, 
            userId: selectedUser._id 
          });
        });
      }
    }
  }, [selectedUser, messages, socket, setUnseenMessages]);

  // Send text message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const txt = (input || "").trim();
    if (!txt) return;
    try {
      await sendMessage({ text: txt });
      setInput("");
      requestAnimationFrame(() => {
        const c = containerRef.current;
        if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
      });
    } catch {
      toast.error("Send failed");
    }
  };

  // Send image
  const handleSendImage = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      try {
        await sendMessage({ text: "", image: dataUrl });
        if (e.target) e.target.value = "";
        requestAnimationFrame(() => {
          const c = containerRef.current;
          if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
        });
      } catch {
        toast.error("Failed to send image");
      }
    };
    reader.readAsDataURL(file);
  };

  // Image error fallback
  const handleImageError = (ev) => {
    ev.currentTarget.onerror = null;
    ev.currentTarget.src = assets.avatar_icon;
  };

  // Handle image click to expand
  const handleImageClick = (imageSrc) => {
    setExpandedImage(imageSrc);
  };

  // Close expanded image with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedImage(null);
      }
    };

    if (expandedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [expandedImage]);

  // Render
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-400 bg-white/10 max-md:hidden rounded-xl border border-white/10 p-6">
        <img src={assets.logo_icon} alt="logo" className="w-16 h-16 opacity-90" />
        <p className="text-lg font-medium text-white/90 tracking-tight">Chat anytime, anywhere</p>
        <p className="text-xs text-white/60 -mt-1">Your conversations are just a message away.</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full relative overflow-y-auto bg-gradient-to-b from-slate-900/40 to-black/20 backdrop-blur-xl pb-[2vh] md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
            onError={handleImageError}
          />

          <p className="flex-1 text-base md:text-lg text-white/90 flex items-center gap-2 font-semibold tracking-tight">
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && (
              <span className="relative inline-flex items-center ml-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="absolute inline-flex w-2 h-2 rounded-full bg-green-500/40 animate-ping"></span>
              </span>
            )}
          </p>

          <img
            onClick={() => setSelectedUser(null)}
            src={assets.arrow_icon}
            alt="back"
            className="md:hidden w-7 h-7 p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          />
        </div>

        {/* Chat area (scrollable) */}
        <div
          ref={containerRef}
          style={{ height: "calc(100% - 120px)" }}
          className="flex flex-col overflow-y-auto px-4 py-4"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            Array.isArray(messages) && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  // Validate message structure
                  if (!msg || !msg.senderId) {
                    console.error("Invalid message format:", msg);
                    return null;
                  }

                  const isMe = msg.senderId === authUser._id;
                  const key = msg._id || `${msg.createdAt || index}-${index}`;
                  
                  return (
                    <div
                      key={key}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {/* Message container */}
                      <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar - Only show for received messages (left side) */}
                        {!isMe && (
                          <div className="flex flex-col items-center justify-end shrink-0">
                            <img
                              src={selectedUser?.profilePic || assets.avatar_icon}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 mb-1"
                              onError={handleImageError}
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Message content */}
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {msg.image ? (
                            // Image message with expand functionality
                            <div 
                              className={`relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 bg-black cursor-zoom-in ${
                                isMe ? "rounded-br-md" : "rounded-bl-md"
                              }`}
                              style={{ maxWidth: "min(300px, 100%)" }}
                              onClick={() => handleImageClick(msg.image)}
                              onMouseEnter={() => setHoveredImage(msg._id)}
                              onMouseLeave={() => setHoveredImage(null)}
                            >
                              <img
                                src={msg.image}
                                alt="message"
                                onError={handleImageError}
                                className="w-full h-auto object-contain max-h-[300px] transition-transform duration-300 hover:scale-105"
                              />
                              
                              {/* Hover overlay with "Click to expand" text */}
                              {hoveredImage === msg._id && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                  <div className="text-white text-xs bg-black/70 px-2 py-1 rounded-full backdrop-blur-sm">
                                    Click to expand
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Text message
                            <div
                              className={`px-4 py-2.5 rounded-2xl border backdrop-blur shadow-sm ${
                                isMe 
                                  ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-50 rounded-br-sm" 
                                  : "bg-slate-700/40 border-slate-400/30 text-slate-100 rounded-bl-sm"
                              }`}
                            >
                              <p className="text-sm break-words">{msg.text}</p>
                            </div>
                          )}
                        </div>

                        {/* Time and avatar for sent messages (right side) */}
                        {isMe && (
                          <div className="flex flex-col items-center justify-end shrink-0">
                            <img
                              src={authUser?.profilePic || assets.avatar_icon}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 mb-1"
                              onError={handleImageError}
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <img src={assets.logo_icon} alt="logo" className="w-16 h-16 opacity-50 mb-4" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start a conversation with {selectedUser.fullName}</p>
              </div>
            )
          )}
        </div>

        {/* Message input */}
        <div className="absolute left-0 right-0 bottom-0 flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-xl border-t border-white/10 z-30">
          <div className="flex-1 flex items-center bg-white/5 px-3 rounded-full ring-1 ring-white/10">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
              type="text"
              placeholder="Send a message"
              className="flex-1 text-sm p-3 bg-transparent border-none rounded-lg outline-none text-white placeholder-gray-400"
            />
            <input onChange={handleSendImage} type="file" id="image" accept="image/*" hidden />
            <label htmlFor="image" className="select-none cursor-pointer">
              <img src={assets.gallery_icon} alt="attach" className="w-5 h-5 mr-1.5 opacity-90 hover:opacity-100 hover:scale-105 active:scale-95 transition cursor-pointer" />
            </label>
          </div>

          <img 
            onClick={handleSendMessage} 
            src={assets.send_button} 
            alt="send" 
            className="w-8 h-8 cursor-pointer hover:scale-105 active:scale-95 transition" 
          />
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className="w-full h-auto max-h-[95vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors duration-200 backdrop-blur-sm"
              aria-label="Close image"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Download button */}
            <a
              href={expandedImage}
              download={`chat-image-${Date.now()}.jpg`}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors duration-200 backdrop-blur-sm"
              aria-label="Download image"
              onClick={(e) => e.stopPropagation()}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
            
            {/* Instruction text (disappears after first interaction) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm opacity-80">
              Click anywhere or press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatContainer;