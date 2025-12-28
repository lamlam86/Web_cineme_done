"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CinemaSystemPage() {
  const [branches, setBranches] = useState([]);
  const [selectedCity, setSelectedCity] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        if (data.branches) {
          setBranches(data.branches);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  // Get unique cities
  const cities = [...new Set(branches.map(b => b.city))];

  // Filter branches by city
  const filteredBranches = selectedCity === "all" 
    ? branches 
    : branches.filter(b => b.city === selectedCity);

  return (
    <div className="app">
      <Header />
      <main className="cinema-system-page">
        <div className="container">
          <h1 className="page-title">HỆ THỐNG RẠP CINESTAR</h1>
          
          {/* City Filter */}
          <div className="city-filter">
            <button
              className={`city-filter__btn ${selectedCity === "all" ? "active" : ""}`}
              onClick={() => setSelectedCity("all")}
            >
              Tất cả
            </button>
            {cities.map(city => (
              <button
                key={city}
                className={`city-filter__btn ${selectedCity === city ? "active" : ""}`}
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Branches Grid */}
          {loading ? (
            <div className="loading-state">Đang tải...</div>
          ) : (
            <div className="branches-grid">
              {filteredBranches.map(branch => (
                <div key={branch.id} className="branch-card">
                  <div className="branch-card__image">
                    <span className="branch-card__icon">🎬</span>
                  </div>
                  <div className="branch-card__info">
                    <h3 className="branch-card__name">{branch.name}</h3>
                    <p className="branch-card__address">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {branch.address}
                    </p>
                    <p className="branch-card__city">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                      {branch.city}
                    </p>
                    <p className="branch-card__hotline">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      {branch.hotline}
                    </p>
                  </div>
                  <div className="branch-card__actions">
                    <Link href={`/lich-chieu?branch=${branch.id}`} className="branch-card__btn">
                      Xem lịch chiếu
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}









