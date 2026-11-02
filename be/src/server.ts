import 'dotenv/config';
import app from './app';
import connectDB from './config/database';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('Hãy cấu hình JWT_SECRET và JWT_REFRESH_SECRET trong be/.env.');
}
const port = Number(process.env.PORT || 8080);
connectDB().catch((error) => { console.error('MongoDB:', error.message); });
const server = app.listen(port, () => {
  console.log(`PreOnic Auth API: http://localhost:${port}/api/v1/auth`);
});
process.on('SIGTERM', () => server.close());
