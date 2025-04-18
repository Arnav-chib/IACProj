import React, { useState, useEffect } from 'react';
import { listTokens, createToken, revokeToken } from '../../services/tokenService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const ApiTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [newToken, setNewToken] = useState(null);
  const [permissions, setPermissions] = useState({
    readForms: true,
    readResponses: true,
    submitResponses: false
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await listTokens();
      setTokens(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to load API tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      setError('Token name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await createToken(newTokenName, permissions);
      setNewToken(response.token);
      await fetchTokens();
      setNewTokenName('');
    } catch (err) {
      console.error('Error creating token:', err);
      setError('Failed to create API token. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this token? This action cannot be undone.')) {
      return;
    }

    try {
      await revokeToken(tokenId);
      await fetchTokens();
    } catch (err) {
      console.error('Error revoking token:', err);
      setError('Failed to revoke API token. Please try again.');
    }
  };

  const togglePermission = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Tokens</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {newToken && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6" role="alert">
          <h3 className="font-bold">Your new API token</h3>
          <p className="my-2">This token will only be displayed once. Copy it now and store it securely.</p>
          <div className="flex items-center">
            <code className="bg-yellow-50 p-2 rounded border border-yellow-300 flex-1 overflow-x-auto">{newToken}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newToken);
                alert('Token copied to clipboard');
              }}
              className="ml-2 px-3 py-1 bg-yellow-700 text-white rounded-md hover:bg-yellow-800 text-sm"
            >
              Copy
            </button>
          </div>
          <button 
            onClick={() => setNewToken(null)}
            className="mt-2 text-yellow-800 hover:text-yellow-900"
          >
            I've saved my token
          </button>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Create New Token</h3>
        
        <div className="mb-4">
          <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700 mb-1">
            Token Name
          </label>
          <input
            type="text"
            id="tokenName"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., Website Integration"
          />
        </div>
        
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </span>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.readForms}
                onChange={() => togglePermission('readForms')}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Read Forms</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.readResponses}
                onChange={() => togglePermission('readResponses')}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Read Responses</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.submitResponses}
                onChange={() => togglePermission('submitResponses')}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Submit Responses</span>
            </label>
          </div>
        </div>
        
        <Button
          onClick={handleCreateToken}
          disabled={creating || !newTokenName.trim()}
        >
          {creating ? 'Creating...' : 'Create Token'}
        </Button>
      </div>
      
      <div className="bg-white shadow-md rounded-md overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b border-gray-200">Your Tokens</h3>
        
        {tokens.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You don't have any API tokens yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {token.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {token.lastUsed ? new Date(token.lastUsed).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <ul className="list-disc pl-4">
                      {token.permissions.readForms && <li>Read Forms</li>}
                      {token.permissions.readResponses && <li>Read Responses</li>}
                      {token.permissions.submitResponses && <li>Submit Responses</li>}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-8 bg-white shadow-md rounded-md p-6">
        <h3 className="text-lg font-semibold mb-4">How to Use API Tokens</h3>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">Embedding Form Results</h4>
          <p className="text-sm text-gray-600 mb-2">
            Use the following HTML code to embed form results on your website:
          </p>
          <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
            {`<iframe
  src="http://localhost:3000/api/embed/results/${tokens.length > 0 ? 'FORM_ID' : '{formId}'}?token=${tokens.length > 0 ? 'YOUR_API_TOKEN' : '{apiToken}'}"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>`}
          </pre>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mt-4">
          <h4 className="font-medium mb-2">API Authentication</h4>
          <p className="text-sm text-gray-600 mb-2">
            Add your API token to requests using one of these methods:
          </p>
          <ul className="list-disc pl-6 text-sm text-gray-600">
            <li className="mb-1">As a query parameter: <code className="bg-gray-200 p-1 rounded">?token=YOUR_API_TOKEN</code></li>
            <li>As a header: <code className="bg-gray-200 p-1 rounded">X-API-Token: YOUR_API_TOKEN</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTokens;
