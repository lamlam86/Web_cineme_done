import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

async function getPromotions() {
  const promotions = await prisma.promotions.findMany({
    where: {
      status: "active",
      OR: [
        { end_date: null },
        { end_date: { gte: new Date() } }
      ]
    },
    orderBy: { id: "desc" }
  });
  return promotions;
}

export default async function PromotionsPage() {
  const promotions = await getPromotions();

  const formatDate = (date) => {
    if (!date) return "Không giới hạn";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatDiscount = (promo) => {
    if (promo.discount_type === "percent") {
      return `${promo.discount_value}%`;
    }
    return `${Number(promo.discount_value).toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="app">
      <Header />
      <main className="promotions-page">
        <div className="container">
          <h1 className="page-title">CHƯƠNG TRÌNH KHUYẾN MÃI</h1>
          <p className="page-subtitle">Khám phá các ưu đãi hấp dẫn từ LMK Cinema</p>

          {promotions.length > 0 ? (
            <div className="promotions-grid">
              {promotions.map(promo => (
                <div key={promo.id} className="promo-card">
                  <div className="promo-card__badge">{formatDiscount(promo)}</div>
                  <div className="promo-card__image">
                    <span className="promo-card__emoji">🎁</span>
                  </div>
                  <div className="promo-card__content">
                    <h3 className="promo-card__title">{promo.name}</h3>
                    <p className="promo-card__desc">{promo.description || "Khuyến mãi đặc biệt"}</p>
                    {promo.code && (
                      <div className="promo-card__code">
                        Mã: <strong>{promo.code}</strong>
                      </div>
                    )}
                    <p className="promo-card__valid">
                      Hiệu lực: {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                    </p>
                    {promo.min_order_value && (
                      <p className="promo-card__min">
                        Đơn tối thiểu: {Number(promo.min_order_value).toLocaleString("vi-VN")}đ
                      </p>
                    )}
                    {promo.max_usage && (
                      <p className="promo-card__usage">
                        Còn lại: {promo.max_usage - promo.usage_count} lượt sử dụng
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🎁</div>
              <h3>Chưa có khuyến mãi</h3>
              <p>Hiện tại chưa có chương trình khuyến mãi nào. Hãy quay lại sau!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
