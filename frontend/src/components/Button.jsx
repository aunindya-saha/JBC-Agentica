import React from 'react';

export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold shadow-md hover:opacity-90 transition"
    >
      {children}
    </button>
  );
}