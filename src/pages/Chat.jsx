import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  const messagesEndRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Load conversation history
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "conversations"),
      where("userId", "==", currentUser.uid),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle forked prompt
  useEffect(() => {
    if (location.state?.forkedMessages) {
      setMessages(location.state.forkedMessages);
      setInput("");
      setCurrentConvoId(null);
    } else if (location.state?.forkedPrompt) {
      setInput(location.state.forkedPrompt);
      setCurrentConvoId(null);
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-save conversation
  useEffect(() => {
    if (messages.length === 0) return;
    if (!currentUser) return;

    const saveConvo = async () => {
      try {
        const convoData = {
          messages: messages,
          userId: currentUser.uid,
          title: messages[0]?.content.slice(0, 50) + "..." || "Untitled",
          updatedAt: serverTimestamp(),
        };

        if (currentConvoId) {
          // Update existing
          await updateDoc(doc(db, "conversations", currentConvoId), convoData);
        } else {
          // Create new
          const docRef = await addDoc(collection(db, "conversations"), {
            ...convoData,
            createdAt: serverTimestamp(),
          });
          setCurrentConvoId(docRef.id);
        }
      } catch (error) {
        console.error("Error auto-saving:", error);
      }
    };

    // Debounce auto-save
    const timeout = setTimeout(saveConvo, 2000);
    return () => clearTimeout(timeout);
  }, [messages, currentUser, currentConvoId]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    setLoading(true);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: newMessages,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiMessage },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  async function handleShareToFeed() {
    if (messages.length === 0) return;

    try {
      await addDoc(collection(db, "posts"), {
        messages: messages,
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email,
        authorPhoto: currentUser.photoURL,
        model: "GPT-3.5",
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp(),
      });

      alert("Shared to feed!");
      navigate("/feed");
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Failed to share");
    }
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    setCurrentConvoId(null);
  }

  function loadConversation(convo) {
    setMessages(convo.messages);
    setCurrentConvoId(convo.id);
    setShowHistory(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="h-screen flex bg-gray-900">
      {/* History Sidebar */}
      {showHistory && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-white font-bold">Conversation History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-2">
            {savedConversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">
                No saved conversations yet
              </p>
            ) : (
              savedConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => loadConversation(convo)}
                  className={`w-full text-left p-3 rounded mb-2 hover:bg-gray-700 transition ${
                    currentConvoId === convo.id ? "bg-gray-700" : "bg-gray-800"
                  }`}
                >
                  <p className="text-white text-sm truncate">{convo.title}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {convo.messages?.length || 0} messages
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              {showHistory ? "◀" : "☰"}
            </button>
            <h1 className="text-2xl font-bold text-white">Synapse</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/feed")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Feed
            </button>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  New Chat
                </button>
                <button
                  onClick={handleShareToFeed}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-semibold"
                >
                  Share
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
              <p>Your messages will be auto-saved</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-lg">
                <p>Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
