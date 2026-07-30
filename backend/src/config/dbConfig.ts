import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5000'),
  dbName: process.env.DB_NAME || 'ai_digital_twin',
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'wqpywppu',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-milestone1-key-phrase-12345',
  nodeEnv: process.env.NODE_ENV || 'development',
  serverPort: parseInt(process.env.PORT || '5001'),
};
