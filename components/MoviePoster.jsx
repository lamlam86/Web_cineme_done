"use client";
import { useState } from "react";

export default function MoviePoster({ poster_url, title, className = "" }) {
  const [imageError, setImageError] = useState(false);

  if (!poster_url || imageError) {
    // Determine which placeholder class to use based on className
    let placeholderClass = "mv-card__no-poster";
    if (className.includes("search-movie-card__poster")) {
      placeholderClass = "search-movie-card__no-poster";
    } else if (className.includes("schedule-movie-poster") || className.includes("schedule")) {
      placeholderClass = "schedule-no-poster";
    }
    
    return (
      <div className={`${placeholderClass} ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <span>Chưa có poster</span>
      </div>
    );
  }

  return (
    <img 
      src={poster_url} 
      alt={title}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}

