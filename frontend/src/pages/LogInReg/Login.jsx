import React, { useEffect, useState } from 'react';
import Button from '../../components/Button'; // adjust the path as necessary
import { User, Lock } from 'lucide-react'; // optional icon library
export default function LoginForm({ onSwitch }) {
 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
   
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        window.location.href = '/chat';
      } else {
        setError(data.msg || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };
 
 
  return (
    <div className=" p-10 rounded-xl text-white border border-white border-opacity-20 shadow-lg backdrop-blur-md
     inset-0 bg-gradient-to-r from-slate-900 to-transparent
    ">
      <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full py-3 px-4 bg-transparent border border-white rounded-full placeholder-white focus:outline-none jump-on-focus"
          />
          <User className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white" />
        </div>
        <div className="relative">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-3 px-4 bg-transparent border border-white rounded-full placeholder-white focus:outline-none jump-on-focus"
          />
          <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 " />
            <span>Remember me</span>
          </label>
          <button type="button" className="underline" >
            Forgot password?
          </button>
        </div>
        <Button type="submit">Login</Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="underline">
          Register
        </button>
      </p>
    </div>
  );
}