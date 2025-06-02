import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;

export default function ProfilePopup({ onClose, className }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
         if (res.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/';
          return;
        }
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
        } else {
          setError(data.msg || 'Failed to fetch profile');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>

    <div className="absolute top-16 z-10 right-6 bg-gray-900 bg-opacity-80 backdrop-frost border border-gray-700 rounded-lg p-6 w-64 text-white shadow-xl">
      <div className=" flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Your Profile</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
      </div>
      <div className="space-y-2 z-index-10">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : profile ? (
          <>
            <p><span className="font-semibold">Name:</span> {profile.username}</p>
            {/* <p><span className="font-semibold">Email:</span> {profile.email}</p> */}
            <button className="mt-4 w-full py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </div>
     </div>
  );
}

