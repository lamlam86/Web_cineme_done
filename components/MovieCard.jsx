import Link from "next/link";

export default function MovieCard({ id, title, img, age }) {
  const safeId = encodeURIComponent(String(id));
  return (
    <div className="mv-card">
      <div className="mv-card__poster">
        {age && <span className="mv-card__age">{age}</span>}
        <img src={img} alt={title} />
      </div>
      <h3 className="mv-card__title">{title}</h3>
      <Link href={`/movie/${safeId}/book`} className="mv-card__btn">
        <img src="/assets/images/ic-ticket.svg" alt="" className="icon-20" />
        Đặt vé
      </Link>
    </div>
  );
}









