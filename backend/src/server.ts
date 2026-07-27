import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import rootRouter from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security Middleware ---
// Helmet for setting secure HTTP headers
app.use(helmet());

// CORS configuration (allow requests from localhost client)
app.use(
  cors({
    origin: '*', // In production, replace with specific domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting: max 100 requests per 15 minutes from an IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Body Parsing Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api', rootRouter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root Route fallback
app.get('/', (req: Request, res: Response) => {
  res.send('AI Personal Productivity & Finance Assistant API - Milestone 1');
});

// --- Error Handling Middleware ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error Handler caught:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
