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

  // Load comments for each post
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Synapse</h1>
          <div className="flex gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-semibold"
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
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-semibold"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
            <p>Be the first to share a conversation!</p>
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-800 rounded border border-gray-700 overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">
                    Posted by{" "}
                    <span className="text-blue-400">{post.authorEmail}</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Model: {post.model}
                  </p>
                </div>
                <button
                  onClick={() => handleFork(post.messages)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition"
                >
                  🔄 Fork
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 bg-gray-900/50">
              {post.messages.map((msg, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">
                    {msg.role === "user" ? "💬 Prompt" : "🤖 Response"}
                  </p>
                  <div
                    className={`p-3 rounded text-sm ${
                      msg.role === "user"
                        ? "bg-blue-900/30 border border-blue-800 text-blue-100"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-4">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition"
              >
                <span>⬆</span>
                <span className="text-sm font-semibold">{post.likes || 0}</span>
              </button>
              <button
                onClick={() => handleDislike(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition"
              >
                <span>⬇</span>
                <span className="text-sm font-semibold">
                  {post.dislikes || 0}
                </span>
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition"
              >
                <span>💬</span>
                <span className="text-sm">
                  {post.comments?.length || 0} Comments
                </span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments[post.id] && (
              <div className="border-t border-gray-700 bg-gray-900/30">
                {/* Add Comment */}
                <div className="p-4 border-b border-gray-700">
                  <textarea
                    value={commentTexts[post.id] || ""}
                    onChange={(e) =>
                      setCommentTexts((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    rows="2"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim()}
                    className="mt-2 px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comment
                  </button>
                </div>

                {/* Comments List */}
                <div className="p-4 space-y-3">
                  {post.comments?.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No comments yet. Be the first!
                    </p>
                  )}
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="bg-gray-800 p-3 rounded">
                      <p className="text-blue-400 text-xs mb-1">
                        {comment.authorEmail}
                      </p>
                      <p className="text-gray-300 text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
