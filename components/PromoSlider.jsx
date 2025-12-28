"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function PromoSlider() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch("/api/promotions");
        const data = await res.json();
        if (data.promotions) {
          setPromotions(data.promotions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPromotions();
  }, []);

  const formatDiscount = (promo) => {
    if (promo.discount_type === "percent") {
      return `Giảm ${promo.discount_value}%`;
    }
    return `Giảm ${Number(promo.discount_value).toLocaleString("vi-VN")}đ`;
  };

  if (loading) {
    return (
      <div className="promo-swiper-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="promo-empty">
        <p>Chưa có khuyến mãi</p>
        <Link href="/chuong-trinh-khuyen-mai" className="promo-link">
          Xem tất cả →
        </Link>
      </div>
    );
  }

  return (
    <div className="promo-swiper">
      <Swiper
        className="swiper"
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={3}
        slidesPerGroup={1}
        spaceBetween={20}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop={promotions.length > 3}
        speed={600}
        breakpoints={{
          0: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {promotions.map((promo) => (
          <SwiperSlide key={promo.id}>
            <Link href="/chuong-trinh-khuyen-mai" className="promo-slide-card">
              <div className="promo-slide-card__badge">{formatDiscount(promo)}</div>
              <div className="promo-slide-card__icon">🎁</div>
              <h3 className="promo-slide-card__title">{promo.name}</h3>
              {promo.code && (
                <div className="promo-slide-card__code">Mã: {promo.code}</div>
              )}
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
