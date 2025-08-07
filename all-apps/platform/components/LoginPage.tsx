
import React, { useState } from 'react';

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
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-brand-dark overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('https://storage.googleapis.com/static.aiforkids.com/prompt_images/e8cbaaa9-d833-41c3-a3d2-431872583842_0_0.png')" }}
      ></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-brand-dark via-transparent to-brand-dark"></div>
      
      <div className="relative z-20 w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-white tracking-tight">ConstructAI</h1>
            <p className="mt-2 text-lg text-brand-accent">Blueprint for Brilliance. Powered by AI.</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="demo: 1234"
                className="block w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-white sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo: 1234"
                className="block w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-white sm:text-sm"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-dark bg-brand-accent hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-accent transition-colors duration-300"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
