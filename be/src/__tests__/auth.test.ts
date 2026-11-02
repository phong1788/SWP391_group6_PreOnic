import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import crypto from 'crypto';
import app from '../app';
import User from '../models/User.model';
import * as emailService from '../services/email.service';
import { authLimiter, registerLimiter, passwordResetLimiter } from '../middlewares/rateLimit.middleware';
import { AuthService } from '../services/auth.service';

let mongo: MongoMemoryServer;
let server: Server;
let baseURL: string;
let otp: string;

beforeEach(() => {
  for (const limiter of [authLimiter, registerLimiter, passwordResetLimiter]) limiter.resetKey('127.0.0.1');
});

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  baseURL = `http://127.0.0.1:${address.port}/api/v1/auth`;
}, 60000);

afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const post = async (path: string, body: object, token?: string, cookie?: string) => {
  const response = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() as any };
};

test.each(['farmer', 'enterprise'])('register, verify OTP, sign in, refresh and logout: %s', async role => {
  jest.spyOn(emailService, 'sendAuthOtpEmail').mockImplementation(async (_email, _name, code) => { otp = code; });
  const registration = { fullName: 'Nguyen Van An', email: `${role}@example.com`, phone: role === 'farmer' ? '0912345678' : '0987654321', password: 'Password123!', confirmPassword: 'Password123!', agreeTerms: true, role };
  const created = await post('/register', registration);
  expect(created.response.status).toBe(201);
  expect(created.body.requiresVerification).toBe(true);
  const stored = await User.findOne({ email: registration.email }).select('+password +authOtpHash');
  expect(stored!.password).not.toBe(registration.password);
  expect(JSON.stringify(stored)).not.toContain('authOtpHash');
  const login = { emailOrPhone: registration.email, password: registration.password };
  expect((await post('/login', login)).response.status).toBe(403);
  expect((await post('/verify-registration-otp', { email: registration.email, otp: 'bad' })).response.status).toBe(400);
  expect((await post('/verify-registration-otp', { email: registration.email, otp })).response.status).toBe(200);
  expect((await post('/login', { ...login, password: 'wrong' })).response.status).toBe(401);
  const signedIn = await post('/login', login);
  expect(signedIn.response.status).toBe(200);
  expect(signedIn.body.data.user.password).toBeUndefined();
  const accessToken = signedIn.body.data.accessToken;
  const cookie = signedIn.response.headers.get('set-cookie')!.split(';')[0];
  expect(signedIn.response.headers.get('set-cookie')).toMatch(/HttpOnly/i);
  const me = await fetch(`${baseURL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(me.status).toBe(200);
  expect((await post('/refresh-token', {}, undefined, cookie)).response.status).toBe(200);
  expect((await post('/logout', {}, accessToken)).response.status).toBe(200);
  expect((await post('/refresh-token', {}, undefined, cookie)).response.status).toBe(401);
});

test('rejects public admin registration and unauthenticated profile access', async () => {
  expect((await post('/register', { role: 'admin' })).response.status).toBe(400);
  expect((await fetch(`${baseURL}/me`)).status).toBe(401);
});

test('password reset rejects invalid token and revokes the refresh session', async () => {
  const user = await User.findOne({ email: 'farmer@example.com' }).select('+refreshToken');
  const resetToken = crypto.randomBytes(32).toString('hex');
  user!.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user!.passwordResetExpires = new Date(Date.now() + 60000);
  user!.refreshToken = 'old-session';
  await user!.save();
  const passwords = { password: 'NewPassword123!', confirmPassword: 'NewPassword123!' };
  expect((await post('/reset-password', { token: 'invalid', ...passwords })).response.status).toBe(400);
  expect((await post('/reset-password', { token: resetToken, ...passwords })).response.status).toBe(200);
  const updated = await User.findById(user!._id).select('+refreshToken +password');
  expect(updated!.refreshToken).toBeUndefined();
  expect(await updated!.comparePassword(passwords.password)).toBe(true);
});

test('expired login lock resets the failed attempt counter', async () => {
  await User.updateOne({ email: 'enterprise@example.com' }, { $set: { loginAttempts: 5, lockUntil: new Date(Date.now() - 1000) } });
  const result = await post('/login', { emailOrPhone: 'enterprise@example.com', password: 'wrong' });
  expect(result.response.status).toBe(401);
  const user = await User.findOne({ email: 'enterprise@example.com' }).select('+loginAttempts +lockUntil');
  expect(user!.loginAttempts).toBe(1);
  expect(user!.lockUntil).toBeUndefined();
});

test('a refresh token can only be rotated once under simultaneous requests', async () => {
  const user = await User.findOne({ email: 'enterprise@example.com' });
  const tokens = AuthService.generateTokens(user!);
  await User.updateOne({ _id: user!._id }, { $set: { refreshToken: tokens.refreshToken } });
  const results = await Promise.allSettled([AuthService.refreshToken(tokens.refreshToken), AuthService.refreshToken(tokens.refreshToken)]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
});

test('malformed OTP and password inputs return validation errors', async () => {
  expect((await post('/verify-registration-otp', { email: {}, otp: 123456 })).response.status).toBe(400);
  expect((await post('/login', { emailOrPhone: 'enterprise@example.com', password: { value: 'Password123!' } })).response.status).toBe(400);
  expect((await post('/reset-password', { token: {}, password: 'Password123!', confirmPassword: 'Password123!' })).response.status).toBe(400);
});

test('single-word names register and an OTP cannot be reused', async () => {
  let code = '';
  jest.spyOn(emailService, 'sendAuthOtpEmail').mockImplementation(async (_email, _name, value) => { code = value; });
  const registration = { fullName: 'An', email: 'single@example.com', phone: '0901112233', password: 'Password123!', confirmPassword: 'Password123!', agreeTerms: true, role: 'farmer' };
  expect((await post('/register', registration)).response.status).toBe(201);
  const user = await User.findOne({ email: registration.email });
  expect(user!.fullName).toBe('An');
  expect((await post('/verify-registration-otp', { email: registration.email, otp: code })).response.status).toBe(200);
  expect((await post('/verify-registration-otp', { email: registration.email, otp: code })).response.status).toBe(400);
});

test('expired OTP and disabled accounts cannot be verified', async () => {
  const user = await User.findOne({ email: 'single@example.com' });
  await User.updateOne({ _id: user!._id }, { $set: { isVerified: false, authOtpPurpose: 'registration', authOtpHash: crypto.createHash('sha256').update('123456').digest('hex'), authOtpExpires: new Date(Date.now() - 1000) } });
  expect((await post('/verify-registration-otp', { email: user!.email, otp: '123456' })).response.status).toBe(400);
  await User.updateOne({ _id: user!._id }, { $set: { isActive: false, authOtpExpires: new Date(Date.now() + 60000) } });
  expect((await post('/verify-registration-otp', { email: user!.email, otp: '123456' })).response.status).toBe(400);
  expect((await post('/resend-registration-otp', { email: user!.email })).response.status).toBe(404);
});
