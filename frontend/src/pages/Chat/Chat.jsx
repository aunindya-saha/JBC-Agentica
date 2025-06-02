import React, { useState, useEffect, useRef } from "react";
import { Pencil, Lightbulb, Compass, Code, User, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProfilePopup from "../Profile/Profile";
import useTypingEffect from "./useTypingEffect";
import ParticlesBackground from "./ParticlesBackground";
import BotMessage from "./BotMessage";

const apiUrl = import.meta.env.VITE_API_URL;

export default function Chat() {
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState("");
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [interruptTyping, setInterruptTyping] = useState(false);
  const lastBotMessageRef = useRef(null);

  const navigate = useNavigate();
  const typedText = useTypingEffect(typingMessage, 10, interruptTyping);

  // Scroll to last bot message smoothly
  useEffect(() => {
    if (lastBotMessageRef.current) {
      lastBotMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, isTyping]);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in");
        navigate("/");
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/api/history`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setChats(data.history || []);
        } else {
          const errorData = await res.json();
          setError(errorData.msg || "Failed to fetch chats");
        }
      } catch {
        setError("Failed to fetch chats");
      }
    };
    fetchChats();
  }, [navigate]);

  const showSuggestions = chats.length === 0;

  // When backend response is ready, start typing effect
  useEffect(() => {
    if (response.length > 0) {
      setTypingMessage(response);
      setIsTyping(true);
      setInterruptTyping(false);
      setResponse("");
    }
  }, [response]);

  // When typing finished, append bot message to chat
  useEffect(() => {
    if (isTyping && typedText === typingMessage && typingMessage.length > 0) {
      setChats((prev) => [
        ...prev,
        {
          message: typingMessage,
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
      setTypingMessage("");
      setInterruptTyping(false);
    }
  }, [typedText, typingMessage, isTyping]);

  // Interrupt typing animation
  const handleSkipTyping = () => {
    setInterruptTyping(true);
  };

  // Send user message and get bot response
  const sendMessage = async (messageToSend) => {
    setError("");
    if (!messageToSend.trim()) return;

    if (isTyping) setInterruptTyping(true);

    try {
      const token = localStorage.getItem("token");
      setChats((prev) => [
        ...prev,
        { message: messageToSend, sender: "user", timestamp: new Date().toISOString() },
      ]);

      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();

      if (res.ok) setResponse(data.response || "No response from bot");
      else setError(data.msg || "Failed to send message");
    } catch {
      setError("Network error");
    }
  };

  // Handle input submit
  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  // Handle clicking a suggestion box — send it as message
  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  return (
    <div className="h-screen w-full flex flex-col relative text-white overflow-hidden bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364]">

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-700 z-10 relative bg-gray-900 bg-opacity-60">
        <div>
          <h1 className="text-3xl font-semibold text-cyan-300">Hello, there</h1>
          <p className="text-xl text-cyan-100">How can I help you today?</p>
        </div>
        <button onClick={() => setShowProfile(!showProfile)}>
          <User className="w-8 h-8 text-white hover:text-cyan-300" />
        </button>
      </div>

      {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} onClick={sendMessage} className="z-[2000] fixed inset-0" />}

      {/* Suggestions & Start text */}
      <ParticlesBackground />
      {showSuggestions && (
        <>
          <div className="text-center text-cyan-200 text-xl mt-8">Start Asking Questions!</div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 z-10 relative">
            {[ 
              { text: "Design a home office setup for remote work under $500.", icon: Pencil },
              { text: "How can I level up my web development expertise in 2025?", icon: Lightbulb },
              { text: "Suggest some useful tools for debugging JavaScript code.", icon: Compass },
              { text: "Create a React JS component for the simple todo list app.", icon: Code },
            ].map(({ text, icon: Icon }, idx) => (
              <div
                key={idx}
                className="bg-gray-900 bg-opacity-40 rounded-xl p-6 text-white hover:bg-opacity-60 cursor-pointer relative"
                onClick={() => handleSuggestionClick(text)}
              >
                <p className="text-lg">{text}</p>
                <Icon className="w-6 h-6 absolute bottom-4 right-4 text-cyan-300" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Chat container */}
      {!showSuggestions && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 relative" style={{ scrollBehavior: "smooth" }}>
          {chats.map((chat, idx) => (
            <div key={idx}>
              {chat.sender === "user" && (
                <div className="flex justify-end">
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-80 text-white rounded-lg p-3 max-w-xl ml-auto">
                    <b>You:</b> {chat.message}
                    <div className="text-xs text-gray-400 mt-1">{new Date(chat.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {chat.sender === "bot" && (
                <div className="flex justify-start items-start">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping mt-2 mr-2" />
                  <div ref={idx === chats.length - 1 ? lastBotMessageRef : null}>
                    <BotMessage message={chat.message} onSkipTyping={handleSkipTyping} />
                    <div className="text-xs text-gray-400 mt-1">{new Date(chat.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start items-start">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping mt-2 mr-2" />
              <BotMessage message={typedText} onSkipTyping={handleSkipTyping} />
            </div>
          )}
        </div>
      )}

      {/* Input bar fixed at bottom */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-gray-900 bg-opacity-60 flex items-center border-t border-gray-700 z-10 relative"
        style={{ position: "sticky", bottom: 0 }}
      >
        <input
          type="text"
          placeholder="Ask JBC-Agent"
          className="flex-grow bg-transparent placeholder-gray-400 text-white px-4 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Chat input"
        />
        <button type="submit" aria-label="Send message">
          <Send className="w-6 h-6 cursor-pointer text-white mx-2" />
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-red-700 text-white px-4 py-2 rounded z-20">
          {error}
        </div>
      )}
    </div>
  );
}
