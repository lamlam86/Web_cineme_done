"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const HOTLINE = "1900 00000";

const JOBS = [
  {
    id: 1,
    title: "Nhân viên bán vé",
    location: "Tất cả chi nhánh",
    type: "Full-time / Part-time",
    salary: "5 - 8 triệu VND",
    requirements: [
      "Nam/Nữ từ 18 - 30 tuổi",
      "Tốt nghiệp THPT trở lên",
      "Giao tiếp tốt, ngoại hình ưa nhìn",
      "Chịu được áp lực công việc",
      "Ưu tiên có kinh nghiệm bán hàng",
    ],
    benefits: [
      "Lương cơ bản + phụ cấp",
      "Xem phim miễn phí",
      "Đào tạo bài bản",
      "Môi trường năng động",
    ],
  },
  {
    id: 2,
    title: "Nhân viên phục vụ F&B",
    location: "Tất cả chi nhánh",
    type: "Full-time / Part-time",
    salary: "5 - 7 triệu VND",
    requirements: [
      "Nam/Nữ từ 18 - 28 tuổi",
      "Tốt nghiệp THPT trở lên",
      "Nhanh nhẹn, chăm chỉ",
      "Có thể làm ca đêm",
    ],
    benefits: [
      "Lương cơ bản + tips",
      "Bữa ăn ca",
      "Xem phim miễn phí",
      "Thưởng lễ, Tết",
    ],
  },
  {
    id: 3,
    title: "Kỹ thuật viên máy chiếu",
    location: "TP.HCM, Bình Dương",
    type: "Full-time",
    salary: "8 - 12 triệu VND",
    requirements: [
      "Nam từ 22 - 35 tuổi",
      "Tốt nghiệp Cao đẳng/Đại học chuyên ngành Điện tử, Kỹ thuật",
      "Có kinh nghiệm vận hành máy chiếu phim",
      "Am hiểu hệ thống âm thanh rạp chiếu",
    ],
    benefits: [
      "Lương thỏa thuận",
      "BHXH, BHYT đầy đủ",
      "Thưởng KPI",
      "Đào tạo nâng cao",
    ],
  },
  {
    id: 4,
    title: "Quản lý rạp",
    location: "TP.HCM",
    type: "Full-time",
    salary: "15 - 25 triệu VND",
    requirements: [
      "Nam/Nữ từ 25 - 40 tuổi",
      "Tốt nghiệp Đại học",
      "Có ít nhất 2 năm kinh nghiệm quản lý",
      "Kỹ năng lãnh đạo, giao tiếp tốt",
      "Tiếng Anh giao tiếp được",
    ],
    benefits: [
      "Lương hấp dẫn + thưởng",
      "Laptop công ty",
      "Du lịch hàng năm",
      "Cơ hội thăng tiến",
    ],
  },
  {
    id: 5,
    title: "Nhân viên Marketing",
    location: "Văn phòng TP.HCM",
    type: "Full-time",
    salary: "10 - 15 triệu VND",
    requirements: [
      "Tốt nghiệp Đại học chuyên ngành Marketing, Truyền thông",
      "Có kinh nghiệm 1-2 năm",
      "Sáng tạo, am hiểu social media",
      "Sử dụng thành thạo các công cụ thiết kế",
    ],
    benefits: [
      "Lương cạnh tranh",
      "Làm việc hybrid",
      "Team building hàng quý",
      "Xem phim miễn phí không giới hạn",
    ],
  },
  {
    id: 6,
    title: "Thực tập sinh (Intern)",
    location: "Tất cả chi nhánh",
    type: "Part-time / Intern",
    salary: "3 - 5 triệu VND",
    requirements: [
      "Sinh viên năm 3, 4 các trường Đại học/Cao đẳng",
      "Năng động, ham học hỏi",
      "Có thể làm việc ít nhất 3 ngày/tuần",
      "Ưu tiên chuyên ngành Quản trị, Marketing, Du lịch",
    ],
    benefits: [
      "Phụ cấp hấp dẫn",
      "Chứng nhận thực tập",
      "Cơ hội trở thành nhân viên chính thức",
      "Xem phim miễn phí",
    ],
  },
];

export default function CareersPage() {
  return (
    <div className="app">
      <Header />
      <main className="careers-page">
        <div className="container">
          {/* Hero Section */}
          <section className="careers-hero">
            <h1 className="page-title">TUYỂN DỤNG</h1>
            <p className="page-subtitle">
              Gia nhập đội ngũ LMK Cinema - Nơi đam mê điện ảnh được thăng hoa
            </p>
          </section>

          {/* Why Join Us */}
          <section className="careers-why">
            <h2>Tại sao chọn LMK Cinema?</h2>
            <div className="careers-why-grid">
              <div className="careers-why-item">
                <span className="careers-why-icon">🎬</span>
                <h3>Môi trường năng động</h3>
                <p>Làm việc trong không gian hiện đại, tiếp xúc với nghệ thuật điện ảnh mỗi ngày</p>
              </div>
              <div className="careers-why-item">
                <span className="careers-why-icon">📈</span>
                <h3>Cơ hội phát triển</h3>
                <p>Lộ trình thăng tiến rõ ràng, được đào tạo và nâng cao kỹ năng liên tục</p>
              </div>
              <div className="careers-why-item">
                <span className="careers-why-icon">🎁</span>
                <h3>Phúc lợi hấp dẫn</h3>
                <p>Lương thưởng cạnh tranh, xem phim miễn phí, và nhiều ưu đãi khác</p>
              </div>
              <div className="careers-why-item">
                <span className="careers-why-icon">👥</span>
                <h3>Đồng nghiệp thân thiện</h3>
                <p>Đội ngũ trẻ trung, nhiệt huyết, luôn sẵn sàng hỗ trợ lẫn nhau</p>
              </div>
            </div>
          </section>

          {/* Job Listings */}
          <section className="careers-jobs">
            <h2>Vị trí đang tuyển</h2>
            <div className="jobs-grid">
              {JOBS.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-card__header">
                    <h3 className="job-card__title">{job.title}</h3>
                    <span className="job-card__type">{job.type}</span>
                  </div>
                  <div className="job-card__meta">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary}</span>
                  </div>
                  <div className="job-card__section">
                    <h4>Yêu cầu:</h4>
                    <ul>
                      {job.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="job-card__section">
                    <h4>Quyền lợi:</h4>
                    <ul className="job-card__benefits">
                      {job.benefits.map((benefit, idx) => (
                        <li key={idx}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>
                  <a 
                    href={`mailto:tuyendung@lmkcinema.vn?subject=Ứng tuyển: ${job.title}`}
                    className="job-card__btn"
                  >
                    Ứng tuyển ngay
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Apply CTA */}
          <section className="careers-cta">
            <h2>Sẵn sàng gia nhập LMK Cinema?</h2>
            <p>Gửi CV của bạn về email hoặc liên hệ hotline để được tư vấn</p>
            <div className="careers-cta__buttons">
              <a href="mailto:tuyendung@lmkcinema.vn" className="btn-cta btn-cta--solid">
                📧 tuyendung@lmkcinema.vn
              </a>
              <a href="tel:190000000" className="btn-cta btn-cta--ghost">
                📞 {HOTLINE}
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

