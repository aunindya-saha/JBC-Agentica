import React, { useState } from 'react';
import Button from '../../components/Button'; // adjust the path as necessary
import { User, Mail, Lock } from 'lucide-react';

export default function RegisterForm({ onSwitch }) {
  
  const [username, setUsername] = useState('');
  //const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // Registration successful, show message or switch to login
        alert('Registration successful! Please log in.');
        if (onSwitch) onSwitch();
      } else {
        setError(data.msg || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  
  
  return (
    <div className="bg-transparent bg-opacity-10      
    backdrop-blur-md border border-white border-opacity-20
    shadow-lg
    p-10 rounded-2xl
    text-white
     inset-0 bg-gradient-to-r from-slate-900 to-transparent
    ">
      <h2 className="text-3xl font-bold mb-6 text-center">Registration</h2>
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
        {/* <div className="relative"> */}
          {/* <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full py-3 px-4 bg-transparent border border-white rounded-full placeholder-white focus:outline-none jump-on-focus"
          />
          <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white" /> */}
        {/* </div> */}
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
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" className="h-4 w-4" />
          <span>I agree to the terms & conditions</span>
        </label>
        <Button type="submit">Register</Button>
        {error && <div className="text-red-400 text-sm">{error}</div>}

      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <button onClick={onSwitch} className="underline">
          Login
        </button>
      </p>
    </div>
  );
}