'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store admin token/session
        localStorage.setItem('adminUser', data.username);
        // Redirect to admin panel using hash-based routing
        window.location.href = '/#/admin/dashboard';
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen dark-bg-section flex items-center justify-center px-6">
      <div className="navy-bg-section rounded-lg shadow-lg p-12 w-full max-w-sm border border-gray-600">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Login</h1>
        <p className="text-gray-300 text-center mb-8">Sign in to your account</p>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Username Input */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Username</label>
            <div className="flex items-center border border-gray-600 bg-gray-700 rounded px-4 py-3">
              <span className="text-gray-400 mr-3">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Username"
                className="flex-1 outline-none text-white bg-gray-700"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Password</label>
            <div className="flex items-center border border-gray-600 bg-gray-700 rounded px-4 py-3">
              <span className="text-gray-400 mr-3">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Password"
                className="flex-1 outline-none text-white bg-gray-700"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full gold-button font-bold py-3 rounded hover:bg-yellow-400 transition-colors disabled:bg-gray-600"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Powered by Prasanna Kumar
        </p>
      </div>
    </div>
  );
}
