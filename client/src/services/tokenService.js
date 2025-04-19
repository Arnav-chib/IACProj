import { api } from './api';

// List API tokens
export const listTokens = async () => {
  console.log('Listing API tokens...');
  const response = await api.get('/tokens');
  console.log('API tokens response:', response.data);
  return response.data.tokens || [];
};

// Create new API token
export const createToken = async (name, permissions) => {
  console.log('Creating API token:', { name, permissions });
  const response = await api.post('/tokens', {
    name,
    permissions
  });
  console.log('Create token response:', response.data);
  return response.data; // The server returns { message, token }
};

// Revoke API token
export const revokeToken = async (tokenId) => {
  console.log('Revoking API token:', tokenId);
  const response = await api.delete(`/tokens/${tokenId}`);
  console.log('Revoke token response:', response.data);
  return response.data;
};

export default {
  listTokens,
  createToken,
  revokeToken
};
