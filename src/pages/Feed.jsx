import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  async function handleLike(postId) {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  async function handleDislike(postId) {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        dislikes: increment(1)
      });
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  }

  function handleFork(messages) {
    // Navigate to chat with the first user message pre-filled
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      navigate('/chat', { state: { forkedPrompt: firstUserMessage.content } });
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Synapse Feed</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              New Chat
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
            <p>Be the first to share a conversation!</p>
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm">
                  Posted by {post.authorEmail}
                </p>
                <p className="text-gray-500 text-xs">
                  Model: {post.model}
                </p>
              </div>
              <button
                onClick={() => handleFork(post.messages)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition"
              >
                🔄 Fork
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-3 mb-4">
              {post.messages.map((msg, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500 mb-1 uppercase">
                    {msg.role === 'user' ? 'Prompt' : 'Response'}
                  </p>
                  <div
                    className={`p-3 rounded ${
                      msg.role === 'user'
                        ? 'bg-blue-900/30 border border-blue-800'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition"
              >
                👍 {post.likes || 0}
              </button>
              <button
                onClick={() => handleDislike(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
              >
                👎 {post.dislikes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
