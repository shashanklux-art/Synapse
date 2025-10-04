import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc 
} from 'firebase/firestore';
import Logo from '../components/Logo';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  const messagesEndRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedConversations(convos);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (location.state?.forkedMessages) {
      setMessages(location.state.forkedMessages);
      setInput('');
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

  useEffect(() => {
    if (messages.length === 0) return;
    if (!currentUser) return;

    const saveConvo = async () => {
      try {
        const convoData = {
          messages: messages,
          userId: currentUser.uid,
          title: messages[0]?.content.slice(0, 50) + '...' || 'Untitled',
          updatedAt: serverTimestamp()
        };

        if (currentConvoId) {
          await updateDoc(doc(db, 'conversations', currentConvoId), convoData);
        } else {
          const docRef = await addDoc(collection(db, 'conversations'), {
            ...convoData,
            createdAt: serverTimestamp()
          });
          setCurrentConvoId(docRef.id);
        }
      } catch (error) {
        console.error('Error auto-saving:', error);
      }
    };

    const timeout = setTimeout(saveConvo, 2000);
    return () => clearTimeout(timeout);
  }, [messages, currentUser, currentConvoId]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    setLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: newMessages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error. Please try again.' 
      }]);
    }

    setLoading(false);
  }

  async function handleShareToFeed() {
    if (messages.length === 0) return;

    try {
      await addDoc(collection(db, 'posts'), {
        messages: messages,
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email,
        authorPhoto: currentUser.photoURL,
        model: 'GPT-3.5',
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp()
      });

      alert('Posted to Synapse!');
      navigate('/feed');
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to post');
    }
  }

  function handleNewChat() {
    setMessages([]);
    setInput('');
    setCurrentConvoId(null);
  }

  function loadConversation(convo) {
    setMessages(convo.messages);
    setCurrentConvoId(convo.id);
    setShowHistory(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="h-screen flex bg-[#0b1416]">
      {/* History Sidebar - Reddit Style */}
      {showHistory && (
        <div className="w-64 bg-[#1a1a1b] border-r border-[#343536] overflow-y-auto">
          <div className="p-3 border-b border-[#343536] flex justify-between items-center">
            <h2 className="text-white font-semibold text-sm">History</h2>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-1">
            {savedConversations.length === 0 ? (
              <p className="text-gray-500 text-xs p-3">No saved conversations</p>
            ) : (
              savedConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => loadConversation(convo)}
                  className={`w-full text-left px-2 py-2 rounded text-sm hover:bg-[#272729] transition ${
                    currentConvoId === convo.id ? 'bg-[#272729]' : ''
                  }`}
                >
                  <p className="text-white text-xs truncate">{convo.title}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
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
        {/* Reddit-style Header */}
        <div className="bg-[#1a1a1b] border-b border-[#343536] h-12 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-[#272729] rounded transition text-gray-400"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/feed')}
              className="px-3 py-1 text-xs font-semibold text-gray-400 hover:bg-[#272729] rounded transition"
            >
              Feed
            </button>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleNewChat}
                  className="px-3 py-1 text-xs font-semibold text-gray-400 hover:bg-[#272729] rounded transition"
                >
                  New
                </button>
                <button
                  onClick={handleShareToFeed}
                  className="px-4 py-1 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full text-xs font-bold transition"
                >
                  Post
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs font-semibold text-gray-400 hover:bg-[#272729] rounded transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h2 className="text-xl font-semibold mb-2 text-white">Start a conversation</h2>
                <p className="text-sm">Your messages auto-save as you chat</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'flex gap-2'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#ff4500] flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#ff4500] text-white'
                        : 'bg-[#1a1a1b] border border-[#343536] text-gray-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#ff4500] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    </svg>
                  </div>
                  <div className="bg-[#1a1a1b] border border-[#343536] text-gray-300 px-3 py-2 rounded text-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input - Reddit Style */}
        <div className="border-t border-[#343536] p-3 bg-[#1a1a1b]">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Message..."
              className="flex-1 px-4 py-2 bg-[#272729] border border-[#343536] focus:border-white rounded text-white text-sm focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-2 bg-[#ff4500] hover:bg-[#ff5414] text-white rounded-full text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}