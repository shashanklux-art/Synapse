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
                    import Logo from '../components/Logo';

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
                            const userDoc = await getDoc(doc(db, 'users', userId));
                            if (userDoc.exists()) {
                              setProfile(userDoc.data());
                            }

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
                          <div className="min-h-screen bg-[#0b1416] flex items-center justify-center">
                            <p className="text-gray-400">Loading...</p>
                          </div>
                        );
                      }

                      if (!profile) {
                        return (
                          <div className="min-h-screen bg-[#0b1416] flex items-center justify-center">
                            <p className="text-gray-400">User not found</p>
                          </div>
                        );
                      }

                      const isOwnProfile = currentUser?.uid === userId;
                      const totalKarma = posts.reduce((sum, post) => sum + ((post.likes || 0) - (post.dislikes || 0)), 0);

                      return (
                        <div className="min-h-screen bg-[#0b1416]">
                          <div className="bg-[#1a1a1b] border-b border-[#343536] sticky top-0 z-50">
                            <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                              <button onClick={() => navigate('/feed')} className="hover:opacity-80 transition">
                                <Logo size="sm" />
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate('/feed')}
                                  className="px-3 py-1 text-xs font-semibold text-gray-400 hover:bg-[#272729] rounded transition"
                                >
                                  Feed
                                </button>
                                {currentUser && (
                                  <>
                                    <button
                                      onClick={() => navigate('/chat')}
                                      className="px-4 py-1.5 bg-transparent border border-[#343536] hover:bg-[#272729] text-white rounded-full text-sm font-semibold transition"
                                    >
                                      Chat
                                    </button>
                                    <button
                                      onClick={handleLogout}
                                      className="text-gray-400 hover:text-white text-sm px-3"
                                    >
                                      Logout
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#ff4500] h-24"></div>

                          <div className="max-w-5xl mx-auto px-4">
                            <div className="bg-[#1a1a1b] border border-[#343536] rounded -mt-8 mb-4 p-4">
                              <div className="flex items-start gap-4">
                                <img
                                  src={profile.photoURL}
                                  alt={profile.displayName}
                                  className="w-20 h-20 rounded-full border-4 border-[#1a1a1b] -mt-10"
                                />
                                <div className="flex-1 pt-2">
                                  <h1 className="text-2xl font-bold text-white mb-1">
                                    {profile.displayName}
                                  </h1>
                                  <p className="text-gray-400 text-sm mb-3">u/{profile.displayName}</p>
                                  {profile.bio && (
                                    <p className="text-gray-300 text-sm mb-3">{profile.bio}</p>
                                  )}
                                  <div className="flex gap-6 text-sm">
                                    <div>
                                      <span className="text-white font-semibold">{totalKarma}</span>
                                      <span className="text-gray-400 ml-1">Karma</span>
                                    </div>
                                    <div>
                                      <span className="text-white font-semibold">{posts.length}</span>
                                      <span className="text-gray-400 ml-1">Posts</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">
                                        Joined {profile.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recently'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {isOwnProfile && (
                                  <button className="px-4 py-1.5 border border-[#343536] hover:bg-[#272729] text-white rounded-full text-sm font-semibold transition">
                                    Edit Profile
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="bg-[#1a1a1b] border border-[#343536] rounded mb-4">
                              <div className="flex border-b border-[#343536]">
                                <button className="px-4 py-2 text-sm font-semibold text-white border-b-2 border-white">
                                  Posts
                                </button>
                                <button className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-[#272729]">
                                  Comments
                                </button>
                                <button className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-[#272729]">
                                  About
                                </button>
                              </div>
                            </div>

                            {posts.length === 0 ? (
                              <div className="bg-[#1a1a1b] border border-[#343536] rounded p-12 text-center">
                                <div className="text-gray-500">
                                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-sm font-semibold mb-1">hmm... u/{profile.displayName} hasn not posted anything</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {posts.map((post) => {
                                  const totalVotes = (post.likes || 0) - (post.dislikes || 0);

                                  return (
                                    <div
                                      key={post.id}
                                      className="bg-[#1a1a1b] border border-[#343536] hover:border-[#4a4a4b] rounded overflow-hidden cursor-pointer transition"
                                      onClick={() => navigate('/feed')}
                                    >
                                      <div className="flex">
                                        <div className="bg-[#161617] w-10 flex flex-col items-center py-2 gap-1">
                                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                                          </svg>
                                          <span className={`text-xs font-bold ${totalVotes > 0 ? 'text-orange-500' : totalVotes < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {totalVotes}
                                          </span>
                                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                          </svg>
                                        </div>

                                        <div className="flex-1 p-2">
                                          <div className="text-xs text-gray-500 mb-1">
                                            Posted {post.createdAt?.toDate?.()?.toLocaleDateString() || 'recently'} • {post.model}
                                          </div>
                                          <div className="text-sm text-gray-300">
                                            <p className="line-clamp-2">
                                              {post.messages[0]?.content || 'Conversation'}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            <span>{post.comments?.length || 0} comments</span>
                                            <span>Share</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }