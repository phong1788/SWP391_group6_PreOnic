jest.mock('axios', () => {
  const client = jest.fn();
  client.interceptors = { request: { use: jest.fn() }, response: { use: jest.fn() } };
  return { create: jest.fn(() => client), post: jest.fn() };
});

const axios = require('axios');
const { default: api } = require('./api');
const { STORAGE_KEYS } = require('../constants');
const onError = api.interceptors.response.use.mock.calls[0][1];

beforeEach(() => {
  localStorage.clear();
  axios.post.mockReset();
  api.mockReset();
});

test.each(['/auth/login', '/auth/google', '/auth/verify-registration-otp'])('does not refresh a rejected public auth request: %s', async url => {
  const error = { config: { url }, response: { status: 401 } };
  await expect(onError(error)).rejects.toBe(error);
  expect(axios.post).not.toHaveBeenCalled();
});

test('refreshes an expired authenticated request and retries with the new token', async () => {
  axios.post.mockResolvedValue({ data: { data: { accessToken: 'renewed-access-token' } } });
  api.mockResolvedValue({ data: { success: true } });
  const config = { url: '/auth/me', headers: {} };
  await onError({ config, response: { status: 401 } });
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(config.headers.Authorization).toBe('Bearer renewed-access-token');
  expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('renewed-access-token');
  expect(api).toHaveBeenCalledWith(config);
});
