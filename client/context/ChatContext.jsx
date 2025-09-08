// src/context/ChatContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [userMessagesMap, setUserMessagesMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { socket, axios, authUser } = useContext(AuthContext) || {};

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load user messages from localStorage on initial load
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('userMessagesMap');
      const storedUnseen = localStorage.getItem('unseenMessages');
      
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // Validate and clean stored messages
        const cleanedMessages = {};
        Object.keys(parsedMessages).forEach(userId => {
          if (Array.isArray(parsedMessages[userId])) {
            cleanedMessages[userId] = parsedMessages[userId].filter(msg => 
              msg && typeof msg === 'object' && msg.senderId && msg.receiverId
            );
          }
        });
        setUserMessagesMap(cleanedMessages);
      }
      
      if (storedUnseen) {
        setUnseenMessages(JSON.parse(storedUnseen));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  // Save user messages and unseen counts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userMessagesMap', JSON.stringify(userMessagesMap));
      localStorage.setItem('unseenMessages', JSON.stringify(unseenMessages));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, [userMessagesMap, unseenMessages]);

  const lastErrorAt = useRef({});
  const showThrottledError = (msg, ms = 3000) => {
    const now = Date.now();
    if (!lastErrorAt.current[msg] || now - lastErrorAt.current[msg] > ms) {
      lastErrorAt.current[msg] = now;
      toast.error(msg);
    }
  };

  const getUsers = useCallback(async () => {
    if (!axios) return;
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data?.success) {
        if (!mountedRef.current) return;
        setUsers(data.users || []);
        // Merge server unseen counts with our local state
        setUnseenMessages(prev => ({ ...prev, ...(data.unseenMessages || {}) }));
      } else {
        showThrottledError(data?.message || "Failed to load users");
      }
    } catch (err) {
      showThrottledError(err?.message || "Network Error");
    }
  }, [axios]);

  const getMessages = useCallback(
    async (userId) => {
      if (!axios || !userId) return;
      setIsLoading(true);
      try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        if (data?.success) {
          if (!mountedRef.current) return;

          // Validate and clean messages from server
          const updatedMessages = (data.messages || []).filter(msg => 
            msg && typeof msg === 'object' && msg.senderId && msg.receiverId
          );

          // Store messages in user-specific map
          setUserMessagesMap(prev => ({
            ...prev,
            [userId]: updatedMessages
          }));

          // If this is the currently selected user, update the messages
          if (selectedUser && selectedUser._id === userId) {
            setMessages(updatedMessages);
          }

          // Clear unseen for this user
          setUnseenMessages(prev => ({ ...(prev || {}), [userId]: 0 }));

          // Mark unseen messages as seen (non-blocking)
          const unseenToMark = updatedMessages.filter(
            (m) => m.senderId === userId && !m.seen
          );
          
          // Send mark as read requests for all unread messages
          if (unseenToMark.length > 0 && socket) {
            unseenToMark.forEach((m) => {
              socket.emit("markAsRead", { 
                messageId: m._id, 
                userId: userId 
              });
            });
          }
        } else {
          showThrottledError(data?.message || "Failed to load messages");
        }
      } catch (err) {
        showThrottledError(err?.message || "Network Error");
      } finally {
        setIsLoading(false);
      }
    },
    [axios, selectedUser, socket]
  );

  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      // Check if we have messages for this user in our map
      if (userMessagesMap[selectedUser._id]) {
        setMessages(userMessagesMap[selectedUser._id]);
        
        // Clear unseen count when selecting a user
        setUnseenMessages(prev => ({ ...prev, [selectedUser._id]: 0 }));
      } else {
        // If not, fetch them
        getMessages(selectedUser._id);
      }
    } else {
      setMessages([]);
    }
  }, [selectedUser, userMessagesMap, getMessages]);

  const sendMessage = useCallback(
    async (messageData) => {
      if (!axios) return showThrottledError("Network unavailable");
      if (!selectedUser || !selectedUser._id)
        return showThrottledError("No recipient selected");

      try {
        // Create a temporary message for optimistic UI update
        const tempMessage = {
          _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: messageData.text || "",
          image: messageData.image || null,
          senderId: authUser?._id,
          receiverId: selectedUser._id,
          createdAt: new Date().toISOString(),
          seen: false,
          isTemp: true
        };

        // Update both the current messages and the user-specific messages
        setMessages(prev => [...(prev || []), tempMessage]);
        setUserMessagesMap(prev => ({
          ...prev,
          [selectedUser._id]: [...(prev[selectedUser._id] || []), tempMessage]
        }));

        // Send the actual message
        const url = `/api/messages/send/${selectedUser._id}`;
        const { data } = await axios.post(url, messageData);

        if (data?.success && data.newMessage) {
          // Validate the new message
          if (!data.newMessage.senderId || !data.newMessage.receiverId) {
            throw new Error("Invalid message format from server");
          }

          // Replace the temporary message with the real one
          setMessages(prev => 
            prev.map(msg => 
              msg.isTemp && msg._id === tempMessage._id ? data.newMessage : msg
            )
          );
          setUserMessagesMap(prev => ({
            ...prev,
            [selectedUser._id]: (prev[selectedUser._id] || []).map(msg => 
              msg.isTemp && msg._id === tempMessage._id ? data.newMessage : msg
            )
          }));
          
          // Emit socket event for real-time update
          if (socket) {
            socket.emit("sendMessage", data.newMessage);
          }
        } else {
          // Remove the temporary message if send failed
          setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
          setUserMessagesMap(prev => ({
            ...prev,
            [selectedUser._id]: (prev[selectedUser._id] || []).filter(msg => msg._id !== tempMessage._id)
          }));
          showThrottledError(data?.message || "Failed to send");
        }
      } catch (err) {
        // Remove the temporary message on error
        setMessages(prev => prev.filter(msg => !msg.isTemp));
        setUserMessagesMap(prev => ({
          ...prev,
          [selectedUser._id]: (prev[selectedUser._id] || []).filter(msg => !msg.isTemp)
        }));
        showThrottledError(err?.message || "Network Error");
      }
    },
    [axios, selectedUser, authUser, socket]
  );

  // Handle incoming socket messages and update unseen counts in real-time
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Validate the incoming message
      if (!newMessage || !newMessage.senderId || !newMessage.receiverId) {
        console.error("Invalid message format received via socket");
        return;
      }

      // Determine which user this message belongs to
      const otherUserId = 
        newMessage.senderId === authUser?._id 
          ? newMessage.receiverId 
          : newMessage.senderId;

      // Update the user-specific messages
      setUserMessagesMap(prev => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), newMessage]
      }));

      // If this message is for the currently selected user, update the messages
      if (selectedUser && selectedUser._id === otherUserId) {
        setMessages(prev => [...(prev || []), newMessage]);
        
        // Mark as seen if it's from the other user (since we're viewing the chat)
        if (newMessage.senderId !== authUser?._id) {
          // Update message to seen locally
          const updatedMessage = { ...newMessage, seen: true };
          
          setUserMessagesMap(prev => {
            const userMessages = prev[otherUserId] || [];
            const updatedMessages = userMessages.map(msg => 
              msg._id === newMessage._id ? updatedMessage : msg
            );
            
            return {
              ...prev,
              [otherUserId]: updatedMessages
            };
          });

          setMessages(prev => 
            prev.map(msg => msg._id === newMessage._id ? updatedMessage : msg)
          );

          // Emit socket event to mark as read
          socket.emit("markAsRead", { 
            messageId: newMessage._id, 
            userId: otherUserId 
          });
        }
      } else if (newMessage.senderId !== authUser?._id) {
        // Increment unseen counter for messages from other users in real-time
        setUnseenMessages(prev => {
          const prevCount = (prev && prev[newMessage.senderId]) || 0;
          return { ...(prev || {}), [newMessage.senderId]: prevCount + 1 };
        });
      }
    };

    // Handle message updates (like seen status)
    const handleMessageUpdate = (updatedMessage) => {
      if (!updatedMessage || !updatedMessage.senderId || !updatedMessage.receiverId) {
        console.error("Invalid message format received via socket");
        return;
      }

      const otherUserId = 
        updatedMessage.senderId === authUser?._id 
          ? updatedMessage.receiverId 
          : updatedMessage.senderId;

      // Update the message in userMessagesMap
      setUserMessagesMap(prev => {
        const userMessages = prev[otherUserId] || [];
        const updatedMessages = userMessages.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        );
        
        return {
          ...prev,
          [otherUserId]: updatedMessages
        };
      });

      // Update messages if this is the currently selected user
      if (selectedUser && selectedUser._id === otherUserId) {
        setMessages(prev => 
          prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
        );
      }

      // If message is marked as seen and we're not in the chat, clear unseen count
      if (updatedMessage.seen && selectedUser?._id !== otherUserId) {
        setUnseenMessages(prev => ({ ...prev, [otherUserId]: 0 }));
      }
    };

    // Handle mark as read events
    const handleMarkAsRead = ({ userId, count }) => {
      setUnseenMessages(prev => ({ ...prev, [userId]: count || 0 }));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageUpdated", handleMessageUpdate);
    socket.on("markAsReadResult", handleMarkAsRead);
    
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageUpdated", handleMessageUpdate);
      socket.off("markAsReadResult", handleMarkAsRead);
    };
  }, [socket, axios, selectedUser, authUser]);

  const value = {
    messages,
    users,
    selectedUser,
    isLoading,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    userMessagesMap
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};