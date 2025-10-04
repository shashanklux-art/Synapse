import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import LoginModal from "../components/LoginModal";
import Logo from "../components/Logo";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribes = posts.map((post) => {
      const commentsQuery = query(
        collection(db, "posts", post.id, "comments"),
        orderBy("createdAt", "desc"),
      );
      return onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, comments } : p)),
        );
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [posts.length]);

  function requireAuth(action) {
    if (!currentUser) {
      setPendingAction(() => action);
      setShowLoginModal(true);
      return false;
    }
    return true;
  }

  function handleLoginSuccess() {
    setShowLoginModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  async function handleLike(postId) {
    if (!requireAuth(() => handleLike(postId))) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1),
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }

  async function handleDislike(postId) {
    if (!requireAuth(() => handleDislike(postId))) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        dislikes: increment(1),
      });
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  }

  function handleFork(messages) {
    if (!requireAuth(() => handleFork(messages))) return;
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      navigate("/chat", {
        state: {
          forkedPrompt: firstUserMessage.content,
          forkedMessages: messages,
        },
      });
    }
  }

  async function handleAddComment(postId) {
    if (!requireAuth(() => handleAddComment(postId))) return;
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return;
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: commentText,
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        createdAt: serverTimestamp(),
      });
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }

  function toggleComments(postId) {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const getVoteColor = (votes) => {
    if (votes > 0) return "text-[#58a6ff]";
    if (votes < 0) return "text-[#238636]";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#0b1416]">
      <div className="bg-[#1a1a1b] border-b border-[#343536] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate('/feed')} className="hover:opacity-80 transition">
            <Logo size="sm" />
          </button>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-1.5 bg-transparent border border-[#343536] hover:bg-[#272729] text-white rounded-full text-sm font-semibold transition"
                >
                  Chat
                </button>
                <button
                  onClick={() => navigate(`/profile/${currentUser.uid}`)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#272729] rounded transition"
                >
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                    alt="Profile"
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-white text-sm hidden md:block">{currentUser.displayName || currentUser.email}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white text-sm px-3"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-1.5 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full text-sm font-bold transition"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-20 bg-[#1a1a1b] rounded p-8">
            <h2 className="text-xl font-semibold mb-2 text-white">There are no posts in this subreddit</h2>
            <p className="text-sm">Be the first to share a conversation</p>
          </div>
        )}

        <div className="space-y-2.5">
          {posts.map((post) => {
            const totalVotes = (post.likes || 0) - (post.dislikes || 0);

            return (
              <div
                key={post.id}
                className="bg-[#1a1a1b] border border-[#343536] hover:border-[#4a4a4b] rounded overflow-hidden transition"
              >
                <div className="flex">
                  <div className="bg-[#161617] w-10 flex flex-col items-center py-2 gap-1">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="text-gray-400 hover:text-[#58a6ff] hover:bg-[#272729] p-1 rounded transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                      </svg>
                    </button>
                    <span className={`text-xs font-bold ${getVoteColor(totalVotes)}`}>
                      {totalVotes}
                    </span>
                    <button
                      onClick={() => handleDislike(post.id)}
                      className="text-gray-400 hover:text-[#238636] hover:bg-[#272729] p-1 rounded transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 p-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                      <button
                        onClick={() => navigate(`/profile/${post.authorId}`)}
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        <img
                          src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                          alt={post.authorName}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-semibold text-white">
                          {post.authorName || post.authorEmail}
                        </span>
                      </button>
                      <span>•</span>
                      <span className="text-gray-500">
                        {post.createdAt?.toDate?.()?.toLocaleDateString() || 'now'}
                      </span>
                      <span>•</span>
                      <span className="text-gray-500">{post.model}</span>
                    </div>

                    <div className="space-y-2.5 mb-3">
                      {post.messages.map((msg, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500">
                              {msg.role === "user" ? "PROMPT" : "RESPONSE"}
                            </span>
                          </div>
                          <div className={`text-sm ${msg.role === "user" ? "text-white" : "text-gray-300"}`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:bg-[#272729] px-2 py-1 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{post.comments?.length || 0} Comments</span>
                      </button>

                      <button
                        onClick={() => handleFork(post.messages)}
                        className="flex items-center gap-1.5 hover:bg-[#272729] px-2 py-1 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Fork</span>
                      </button>

                      <button className="flex items-center gap-1.5 hover:bg-[#272729] px-2 py-1 rounded transition">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="mt-4 pt-3 border-t border-[#343536]">
                        <div className="mb-3">
                          <textarea
                            value={commentTexts[post.id] || ""}
                            onChange={(e) =>
                              setCommentTexts((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="What are your thoughts?"
                            className="w-full px-3 py-2 bg-[#272729] border border-[#343536] focus:border-[#58a6ff] rounded text-white text-sm resize-none focus:outline-none"
                            rows="3"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentTexts[post.id]?.trim()}
                              className="px-6 py-1.5 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Comment
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {post.comments?.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">
                              No comments yet. Be the first to share what you think!
                            </p>
                          )}
                          {post.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-400">
                                    {comment.authorEmail}
                                  </span>
                                  <span className="text-xs text-gray-600">now</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}