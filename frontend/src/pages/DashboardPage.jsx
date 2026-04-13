import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Mail, Clock, User, Shield, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, accessToken } = useContext(AuthContext);
  const [showToken, setShowToken] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">Please log in to view this page</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-slate-700/50 backdrop-blur-xl bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-white">AI Editor</span>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{user.email}</span>
          </h1>
          <p className="text-slate-400">
            You're successfully logged in to your AI Editor account
          </p>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* User Details Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-slate-600/50 transition">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Account Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  User ID
                </p>
                <p className="text-slate-300 font-mono text-sm break-all">{user.id}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-400 font-medium">Authenticated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 hover:border-slate-600/50 transition">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Security
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Session Token (Access)
                </p>
                <div className="relative">
                  <div className="bg-slate-700/50 rounded-lg p-3 font-mono text-xs text-slate-400 break-all max-h-20 overflow-hidden">
                    {showToken ? accessToken : '••••••••••••••••'}
                  </div>
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 text-xs font-medium transition"
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Token Expiry
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">15 minutes</span>
                  <span className="text-xs text-slate-500">(auto-renews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Available Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            Coming Soon Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Create Documents', description: 'Start creating and editing documents' },
              { title: 'Block Editor', description: 'Organize your content with blocks' },
              { title: 'Share & Collaborate', description: 'Share documents with others' },
              { title: 'Real-time Sync', description: 'Automatic synchronization' },
              { title: 'Version History', description: 'Track all changes' },
              { title: 'Templates', description: 'Choose from pre-built templates' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-slate-600/50 transition"
              >
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">
            Check back soon for more features!
          </p>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition border border-slate-600/50 hover:border-slate-600"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
