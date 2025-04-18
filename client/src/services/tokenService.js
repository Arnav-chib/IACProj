import api from './api';

// List API tokens
export const listTokens = async () => {
  const response = await api.get('/tokens');
  return response.data.tokens;
};

// Create new API token
export const createToken = async (name, permissions) => {
  const response = await api.post('/tokens', { name, permissions });
  return response.data;
};

// Revoke API token
export const revokeToken = async (tokenId) => {
  const response = await api.delete(`/tokens/${tokenId}`);
  return response.data;
};
