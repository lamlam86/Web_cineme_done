import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// API Routes
import authRoutes from './routes/auth.js';
import moviesRoutes from './routes/movies.js';
import bookingsRoutes from './routes/bookings.js';
import branchesRoutes from './routes/branches.js';
import concessionsRoutes from './routes/concessions.js';
import showtimesRoutes from './routes/showtimes.js';
import promotionsRoutes from './routes/promotions.js';
import searchRoutes from './routes/search.js';
import paymentsRoutes from './routes/payments.js';
import cronRoutes from './routes/cron.js';

// Admin routes
import adminMoviesRoutes from './routes/admin/movies.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminCinemasRoutes from './routes/admin/cinemas.js';
import adminShowtimesRoutes from './routes/admin/showtimes.js';
import adminPromotionsRoutes from './routes/admin/promotions.js';
import adminOrdersRoutes from './routes/admin/orders.js';

app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/concessions', concessionsRoutes);
app.use('/api/showtimes', showtimesRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/cron', cronRoutes);

// Admin routes
app.use('/api/admin/movies', adminMoviesRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/cinemas', adminCinemasRoutes);
app.use('/api/admin/showtimes', adminShowtimesRoutes);
app.use('/api/admin/promotions', adminPromotionsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
});

