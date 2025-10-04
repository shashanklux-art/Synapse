import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        // Load user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Load user's posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const postsSnapshot = await getDocs(postsQuery);
        const userPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Synapse</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/feed')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Feed
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => navigate('/chat')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Chat
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile.displayName}
              </h2>
              <p className="text-gray-400 text-sm mb-3">{profile.email}</p>
              {profile.bio && (
                <p className="text-gray-300 mb-3">{profile.bio}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{posts.length} posts</span>
                <span>
                  Joined {profile.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <h3 className="text-xl font-bold text-white mb-4">
          {isOwnProfile ? 'Your Posts' : `Posts by ${profile.displayName}`}
        </h3>

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded border border-gray-700 overflow-hidden cursor-pointer hover:border-gray-600 transition"
                onClick={() => navigate('/feed')}
              >
                <div className="p-4">
                  <p className="text-gray-500 text-xs mb-2">
                    Model: {post.model}
                  </p>
                  <div className="space-y-2">
                    {post.messages.slice(0, 2).map((msg, idx) => (
                      <div key={idx}>
                        <p className="text-xs text-gray-500 uppercase">
                          {msg.role === 'user' ? 'Prompt' : 'Response'}
                        </p>
                        <p className="text-gray-300 text-sm truncate">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-400">
                    <span>⬆ {post.likes || 0}</span>
                    <span>⬇ {post.dislikes || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}