"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


type Role = "user" | "bot";
interface Message {
  role: Role;
  text: string;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const chat = chatRef.current;
     if (!chat) return;
    const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 150;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    }
  }, [messages, typingText]);


  
  const typeEffect = (text: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    let currentText = "";
    let i = 0;
    controllerRef.current = controllerRef.current ?? new AbortController();
    setTypingText(""); // reset before start

    typingIntervalRef.current = setInterval(() => {
      if (controllerRef.current === null) { // stopped manually
        clearInterval(typingIntervalRef.current!);
        setMessages(prev => [...prev, { role: "bot", text: currentText }]);
        setTypingText("");
        setLoading(false);
        return;
      }

      if (i < text.length) {
        currentText += text[i];
        setTypingText(currentText); // use local buffer instead of async state append
        i++;
      } 
      else {
        clearInterval(typingIntervalRef.current!);
        setMessages(prev => [...prev, { role: "bot", text }]);
        setTypingText("");
        setLoading(false);
        controllerRef.current = null;
      }
    }, 25);
  };


  /** Send a user message to backend */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { reply?: string } = await res.json();
      typeEffect(data.reply ?? "No response from the model.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Keep partial text if stopped during fetch (no full reply yet)
        if (typingText) {
          setMessages((prev) => [...prev, { role: "bot", text: typingText }]);
          setTypingText("");
        } else {
          setMessages((prev) => [...prev, { role: "bot", text: "⏹️ Generation stopped." }]);
        }
      } else {
        console.error("Error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ Something went wrong. Please try again." },
        ]);
      }
      setLoading(false);
      controllerRef.current = null;
    }
  };

  /** Stop both API call and typing animation */
  const stopGenerating = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // Preserve whatever text was typed so far
    if (typingText) {
      setMessages((prev) => [...prev, { role: "bot", text: typingText }]);
      setTypingText("");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) sendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 pb-6">
      {/* Chat container */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-4 py-6">
        <div
          ref={chatRef}
          className="w-full max-w-3xl flex-1 bg-white/15 backdrop-blur-lg rounded-2xl shadow-lg overflow-y-auto p-6 border border-white/20"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col justify-center items-center h-[70vh] text-center space-y-4">
              <h1 className="text-3xl font-semibold text-white drop-shadow-lg">
                Start chatting with Gemini 🤖
              </h1>
              <p className="text-gray-200">Type a message below to begin.</p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xl p-3 rounded-2xl shadow-sm ${
                  m.role === "user"
                  ? "bg-indigo-500 text-white rounded-br-none"
                  : "bg-white/90 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {m.text}
                    </ReactMarkdown>

                  </div>
                </div>
              </div>
            ))}


            {typingText && (
              <div className="flex justify-start">
                <div className="max-w-xl p-3 rounded-2xl bg-white/90 text-gray-900 rounded-bl-none shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {typingText + "▋"}
                    </ReactMarkdown>

                  </div>
                </div>
              </div>
            )}


            {loading && !typingText && (
              <div className="flex justify-start">
                <div className="bg-white/90 text-gray-900 px-3 py-2 rounded-2xl shadow-sm">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.2s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="w-full max-w-3xl bg-white/20 backdrop-blur-md border border-white/30 mt-4 rounded-xl shadow-lg p-3">
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border border-gray-300/50 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/80"
              placeholder="Type your message..."
            />
            {!loading ? (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  input.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Send
              </button>
            ) : (
              <button
                onClick={stopGenerating}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}