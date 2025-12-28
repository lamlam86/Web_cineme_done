"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Static banners
const STATIC_BANNERS = [
  { 
    id: 1, 
    media: "https://api-website.cinestar.com.vn/media/.renditions/wysiwyg/CMSPage/Member/Rectangle_1899.png", 
    name: "Khuyến Mãi",
    link: "/chuong-trinh-khuyen-mai"
  },
  { 
    id: 2, 
    media: "https://gscvietnam.com/wp-content/uploads/2023/10/Mat-tua-lung-cua-ghe-con-in-logo-CineStar-sang-trong.jpg", 
    name: "Combo Bắp Nước",
    link: "/movie"
  },
  { 
    id: 3, 
    media: "https://lh3.googleusercontent.com/JB0BUJaaKjfAIXhnIMScZVudCo8_CFLk_phIeiTvywATFpVY9x2zH17cZHbXDNmAzy-UR1cmCWsi8XihDo8FXEWRp0ofOysr8A=rw-v1-w2048", 
    name: "Phim Hot",
    link: "/movie"
  },
  { 
    id: 4, 
    media: "https://evgroup.vn/wp-content/uploads/2021/01/EV_Cinestar-Sinh-Vi%C3%AAn.png", 
    name: "Khuyến Mãi",
    link: "/chuong-trinh-khuyen-mai"
  },
  { 
    id: 5, 
    media: "https://evgroup.vn/wp-content/uploads/2021/01/EV_Cinestar-Hu%E1%BA%BF_1.png", 
    name: "Khuyến Mãi",
    link: "/chuong-trinh-khuyen-mai"
  },
];

export default function BannerSlider() {
  const [banners, setBanners] = useState(STATIC_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedMovies() {
      try {
        // Try to get featured movies
        const res = await fetch("/api/movies/featured");
        const data = await res.json();
        
        if (data.movies && data.movies.length > 0) {
          // Use featured movies as banners
          setBanners(data.movies.map(m => ({
            id: m.id,
            media: m.backdrop_url || m.poster_url,
            name: m.title,
            link: `/movie/${m.id}`,
            isMovie: true
          })));
        }
        // If no featured movies, keep STATIC_BANNERS
      } catch (err) {
        console.log("Using static banners");
        // Keep STATIC_BANNERS on error
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedMovies();
  }, []);

  if (loading) {
    return (
      <div className="banner-wrap banner-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="banner-wrap">
      <Swiper
        className="banner-swiper"
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1.2}
        centeredSlides={true}
        spaceBetween={20}
        loop={banners.length > 2}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ 
          delay: 4000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        breakpoints={{
          640: { slidesPerView: 1.2, spaceBetween: 20 },
          768: { slidesPerView: 1.3, spaceBetween: 30 },
          1024: { slidesPerView: 1.2, spaceBetween: 40 },
          1200: { slidesPerView: 1.2, spaceBetween: 50 },
        }}
      >
        {banners.map((banner, i) => (
          <SwiperSlide key={banner.id || i} className="banner-slide">
            {banner.link ? (
              <Link href={banner.link} className="banner-link">
                {banner.media?.startsWith('http') ? (
                  <img
                    src={banner.media}
                    alt={banner.name}
                    className="banner-img-external"
                  />
                ) : banner.media ? (
                  <Image
                    src={banner.media}
                    alt={banner.name}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    className="banner-img"
                  />
                ) : (
                  <div className="banner-placeholder">
                    <span>🎬</span>
                    <h2>{banner.name}</h2>
                  </div>
                )}
                {banner.isMovie && (
                  <div className="banner-overlay">
                    <h2 className="banner-title">{banner.name}</h2>
                    <span className="banner-cta">Xem chi tiết →</span>
                  </div>
                )}
              </Link>
            ) : (
              <div className="banner-static">
                {banner.media?.startsWith('http') ? (
                  <img
                    src={banner.media}
                    alt={banner.name}
                    className="banner-img-external"
                  />
                ) : (
                  <Image
                    src={banner.media}
                    alt={banner.name}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    className="banner-img"
                  />
                )}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
