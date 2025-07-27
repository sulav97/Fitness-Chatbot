import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const CHAT_HISTORY_KEY = "fitness_chat_history";

const initialBotMessage = {
  sender: "bot",
  text: "Hi! I'm your Fitness Chatbot. How can I help you today?",
};

const Chatbox = () => {
  const [messages, setMessages] = useState([initialBotMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      } catch {
        setMessages([initialBotMessage]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/chat", {
        message: userMessage,
      });
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, there was an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => e.key === "Enter" && sendMessage();

  const handleClearChat = () => {
    setMessages([initialBotMessage]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col border-r border-gray-200 bg-white text-gray-800 p-4">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span role="img" aria-label="gym">💪</span>
          Fitness Bot
        </h2>
        <nav className="space-y-3">
          <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded-lg">💬 Chat</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200 text-sm">
          <button onClick={handleClearChat} className="hover:underline flex items-center gap-2">
            <span role="img" aria-label="delete">🗑️</span> Clear Conversation
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-between bg-white">
        {/* Header */}
        <header className="w-full p-4 border-b border-gray-200 bg-white text-center text-lg font-semibold tracking-wide">
          Your Fitness Assistant
        </header>

        {/* Chat Display */}
        <div className="flex-1 w-full max-w-4xl px-4 sm:px-8 py-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-xl whitespace-pre-line text-sm sm:text-base shadow-md flex items-center gap-2
                ${msg.sender === "user" 
                  ? "bg-blue-100 text-blue-900 rounded-br-md" 
                  : "bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200"}`}
              >
                {msg.sender === "bot" && (
                  <span role="img" aria-label="bot" className="mr-2">🤖</span>
                )}
                {msg.text}
                {msg.sender === "user" && (
                  <span role="img" aria-label="user" className="ml-2">💪</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm animate-pulse border border-gray-200">
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Section */}
        <footer className="w-full p-4 border-t border-gray-200 bg-white">
          <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 bg-gray-100 text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm sm:text-base transition disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Chatbox;
