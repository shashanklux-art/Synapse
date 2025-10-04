import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b1416]">
      {/* Navigation */}
      <nav className="bg-[#1a1a1b] border-b border-[#343536]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex gap-3">
            {currentUser ? (
              <button
                onClick={() => navigate('/feed')}
                className="px-6 py-2 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full font-semibold transition"
              >
                Go to Feed
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 border border-[#343536] hover:bg-[#272729] text-white rounded-full font-semibold transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full font-semibold transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Share AI Conversations,
            <br />
            <span className="bg-gradient-to-r from-[#58a6ff] to-[#238636] bg-clip-text text-transparent">
              Fork & Remix Prompts
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Synapse is a social platform for sharing AI conversations. Discover amazing prompts, 
            fork them to your own chat, and share your discoveries with the community.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(currentUser ? '/chat' : '/login')}
              className="px-8 py-3 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full font-bold text-lg transition"
            >
              Start Chatting
            </button>
            <button
              onClick={() => navigate('/feed')}
              className="px-8 py-3 border border-[#343536] hover:bg-[#272729] text-white rounded-full font-bold text-lg transition"
            >
              Explore Feed
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
            <div className="w-12 h-12 bg-[#58a6ff]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Chat with AI</h3>
            <p className="text-gray-400">
              Have conversations with GPT-3.5 directly in the app. All your chats are auto-saved to history.
            </p>
          </div>

          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
            <div className="w-12 h-12 bg-[#238636]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Share & Discover</h3>
            <p className="text-gray-400">
              Post your best conversations to the feed. Explore what others are creating and learning.
            </p>
          </div>

          <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg p-6">
            <div className="w-12 h-12 bg-[#58a6ff]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fork & Remix</h3>
            <p className="text-gray-400">
              Found an interesting prompt? Fork it to your chat and build upon it. Collaborate on AI discoveries.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-[#58a6ff] flex items-center justify-center flex-shrink-0 text-white font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Start a Conversation</h4>
                <p className="text-gray-400">Chat with AI about anything. Your conversations are automatically saved to your history.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-[#238636] flex items-center justify-center flex-shrink-0 text-white font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Share to the Feed</h4>
                <p className="text-gray-400">Found something interesting? Post it to the feed so others can discover your prompt.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-[#58a6ff] flex items-center justify-center flex-shrink-0 text-white font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Fork & Build</h4>
                <p className="text-gray-400">See a prompt you like? Fork it to your chat and continue the conversation in your own direction.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-gradient-to-r from-[#58a6ff]/10 to-[#238636]/10 border border-[#343536] rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to explore AI conversations?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join the community and start discovering amazing prompts today.</p>
          <button
            onClick={() => navigate(currentUser ? '/chat' : '/login')}
            className="px-10 py-4 bg-[#58a6ff] hover:bg-[#4a9aed] text-white rounded-full font-bold text-lg transition"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#343536] mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Synapse. Built with Claude.</p>
        </div>
      </footer>
    </div>
  );
}