import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === '1234' && password === '1234') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 text-base-content animate-fade-in">
      <div className="w-full max-w-sm p-8 space-y-8 bg-base-100 rounded-2xl shadow-2xl border border-base-300">
        <div className="text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-brand-primary" />
            <h1 className="mt-4 text-3xl font-bold text-base-content">AI Platform Hub</h1>
            <p className="mt-2 text-base-content-secondary">Please sign in to continue</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="text-sm font-bold text-base-content-secondary block mb-2">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Hint: 1234"
                className="w-full px-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-bold text-base-content-secondary block mb-2">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hint: 1234"
                className="w-full px-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
