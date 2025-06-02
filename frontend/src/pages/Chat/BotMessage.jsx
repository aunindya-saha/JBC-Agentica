// src/components/BotMessage.jsx
import React from "react";
import ReactMarkdown from "react-markdown";

export default function BotMessage({ message, onSkipTyping }) {
  // Helper to convert URLs in text to links (simple regex)
  // ReactMarkdown also supports autolinking if enabled, but
  // for basic you can rely on markdown links or use this fallback.
  // Here we assume backend sends markdown with links if needed.

  return (
    <div className="relative group bg-gray-800 text-white rounded-lg p-4 max-w-xl border-l-4 border-cyan-400 shadow-md font-mono prose prose-invert prose-sm">
      <ReactMarkdown>{message}</ReactMarkdown>

      {/* Skip button - only visible on hover */}
      <button
        onClick={onSkipTyping}
        aria-label="Skip typing animation"
        className="absolute top-2 right-2 text-cyan-400 bg-gray-900 bg-opacity-70 rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        type="button"
      >
        Skip
      </button>
    </div>
  );
}
