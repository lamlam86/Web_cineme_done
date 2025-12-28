import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const currency = (value) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const buildLinePoints = (values) => {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 100;
      const normalized = max === min ? 0.5 : (value - min) / (max - min || 1);
      const y = 100 - normalized * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');
};

const formatMonthLabel = (date) =>
  `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    revenueTodayAgg,
    revenueMonthAgg,
    ticketsMonth,
    newCustomers,
    monthlyBookings,
    movieSalesRaw,
    branchSalesRaw,
    recentBookings,
  ] = await Promise.all([
    prisma.bookings.aggregate({
      _sum: { total_amount: true },
      where: { created_at: { gte: startOfDay } },
    }),
    prisma.bookings.aggregate({
      _sum: { total_amount: true },
      where: { created_at: { gte: startOfMonth } },
    }),
    prisma.booking_items.count({
      where: { booking: { created_at: { gte: startOfMonth } } },
    }),
    prisma.users.count({ where: { created_at: { gte: startOfMonth } } }),
    prisma.bookings.findMany({
      where: { created_at: { gte: sixMonthsAgo } },
      select: { created_at: true, total_amount: true },
      orderBy: { created_at: 'asc' },
    }),
    prisma.movies.findMany({
      select: {
        id: true,
        title: true,
        showtimes: {
          select: {
            bookings: {
              select: {
                total_amount: true,
                booking_items: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.branches.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        screens: {
          select: {
            showtimes: {
              select: {
                bookings: {
                  select: {
                    total_amount: true,
                    booking_items: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.bookings.findMany({
      orderBy: { created_at: 'desc' },
      take: 6,
      select: {
        id: true,
        booking_code: true,
        total_amount: true,
        payment_status: true,
        created_at: true,
        showtime: {
          select: {
            movie: { select: { title: true } },
            start_time: true,
          },
        },
      },
    }),
  ]);

  const revenueToday = Number(revenueTodayAgg._sum.total_amount ?? 0);
  const revenueMonth = Number(revenueMonthAgg._sum.total_amount ?? 0);

  const monthlyLabels = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    monthlyLabels.push({ label: formatMonthLabel(date), value: 0 });
  }
  const monthlyMap = new Map(monthlyLabels.map(item => [item.label, item]));
  monthlyBookings.forEach(booking => {
    const label = formatMonthLabel(new Date(booking.created_at));
    const target = monthlyMap.get(label);
    if (target) {
      target.value += Number(booking.total_amount ?? 0);
    }
  });
  const monthlySeries = monthlyLabels;

  const movieStats = movieSalesRaw
    .map(movie => {
      let tickets = 0;
      let revenue = 0;
      movie.showtimes.forEach(showtime => {
        showtime.bookings.forEach(booking => {
          tickets += booking.booking_items.length;
          revenue += Number(booking.total_amount ?? 0);
        });
      });
      return {
        id: Number(movie.id),
        title: movie.title,
        tickets,
        revenue,
      };
    })
    .filter(item => item.tickets > 0 || item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const branchStats = branchSalesRaw
    .map(branch => {
      let tickets = 0;
      let revenue = 0;
      branch.screens.forEach(screen => {
        screen.showtimes.forEach(showtime => {
          showtime.bookings.forEach(booking => {
            tickets += booking.booking_items.length;
            revenue += Number(booking.total_amount ?? 0);
          });
        });
      });
      return {
        id: branch.id,
        name: branch.name,
        city: branch.city ?? '',
        tickets,
        revenue,
      };
    })
    .filter(item => item.tickets > 0 || item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const topMovieBars = movieStats.slice(0, 4);
  const maxTickets = Math.max(...topMovieBars.map(item => item.tickets), 1);
  const linePoints = buildLinePoints(monthlySeries.map(item => item.value));

  const latestOrders = recentBookings.map(order => ({
    id: order.id,
    code: order.booking_code,
    movie: order.showtime.movie.title,
    time: order.showtime.start_time,
    total: Number(order.total_amount ?? 0),
    status: order.payment_status,
    createdAt: order.created_at,
  }));

  return (
    <div className="admin-stack">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Doanh thu theo ngày, khách hàng mới, tổng số vé bán ra</p>
          <h2>Dashboard tổng quan</h2>
        </div>
      </div>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-card kpi">
          <p>Doanh thu hôm nay</p>
          <strong>{currency(revenueToday)}</strong>
          <span>Ngày {new Date().toLocaleDateString('vi-VN')}</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Khách hàng mới (tháng)</p>
          <strong>{newCustomers}</strong>
          <span>Tháng {now.getMonth() + 1}</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Vé bán ra (tháng)</p>
          <strong>{ticketsMonth}</strong>
          <span>Đã xác nhận</span>
        </article>
        <article className="dashboard-card kpi">
          <p>Tổng doanh thu (tháng)</p>
          <strong>{currency(revenueMonth)}</strong>
          <span>Tháng {now.getMonth() + 1}</span>
        </article>
      </section>

      <section className="dashboard-chart-grid">
        <article className="dashboard-card chart">
          <header>
            <div>
              <p>Top phim được quan tâm</p>
              <h3>{topMovieBars.length ? `${topMovieBars.length} tựa phim` : 'Chưa có dữ liệu'}</h3>
            </div>
          </header>
          <div className="chart-bars">
            {topMovieBars.length === 0 && <p className="empty-label">Chưa có vé nào được bán.</p>}
            {topMovieBars.map(movie => (
              <div className="chart-bar" key={movie.id}>
                <div className="chart-bar__info">
                  <span>{movie.title}</span>
                  <small>{movie.tickets.toLocaleString('vi-VN')} vé</small>
                </div>
                <div className="chart-bar__track">
                  <div
                    className="chart-bar__value"
                    style={{ width: `${(movie.tickets / maxTickets) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card chart">
          <header>
            <div>
              <p>Doanh thu theo tháng</p>
              <h3>{currency(monthlySeries.reduce((sum, item) => sum + item.value, 0))}</h3>
            </div>
          </header>
          <div className="line-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dashboardLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#dashboardLine)"
                strokeWidth="2"
                points={linePoints}
              />
              <polyline
                fill="rgba(192,132,252,0.08)"
                stroke="transparent"
                points={`${linePoints} 100,100 0,100`}
              />
            </svg>
            <div className="line-chart__labels">
              {monthlySeries.map(item => (
                <span key={item.label}>{item.label}</span>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-table-grid">
        <article className="dashboard-card table">
          <header>
            <h3>Doanh thu theo phim</h3>
            <Link href="/admin/movies">Xem tất cả</Link>
          </header>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tên phim</th>
                <th>Vé bán ra</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {movieStats.slice(0, 5).map(movie => (
                <tr key={movie.id}>
                  <td>{movie.title}</td>
                  <td>{movie.tickets.toLocaleString('vi-VN')}</td>
                  <td>{currency(movie.revenue)}</td>
                </tr>
              ))}
              {movieStats.length === 0 && (
                <tr>
                  <td colSpan={3}>Chưa ghi nhận doanh thu.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="dashboard-card table">
          <header>
            <h3>Doanh thu theo rạp</h3>
            <Link href="/admin/cinemas">Xem tất cả</Link>
          </header>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rạp chiếu</th>
                <th>Vé bán</th>
                <th>Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {branchStats.slice(0, 5).map(branch => (
                <tr key={branch.id}>
                  <td>
                    {branch.name}
                    {branch.city && <small className="muted"> • {branch.city}</small>}
                  </td>
                  <td>{branch.tickets.toLocaleString('vi-VN')}</td>
                  <td>{currency(branch.revenue)}</td>
                </tr>
              ))}
              {branchStats.length === 0 && (
                <tr>
                  <td colSpan={3}>Chưa có doanh thu từ các rạp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="dashboard-card table">
          <header>
            <h3>Đơn hàng gần đây</h3>
            <Link href="/admin/orders">Xem tất cả</Link>
          </header>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Phim</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.code}</td>
                  <td>{order.movie}</td>
                  <td>{new Date(order.time).toLocaleString('vi-VN')}</td>
                  <td>{currency(order.total)}</td>
                  <td>
                    <span className={`status-badge status-badge--${order.status}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {latestOrders.length === 0 && (
                <tr>
                  <td colSpan={5}>Chưa có đơn hàng.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}









