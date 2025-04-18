import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';

const EmbedCode = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embedOptions, setEmbedOptions] = useState({
    showResults: false,
    showAnalytics: false,
    theme: 'light',
    width: '100%',
    height: '600px'
  });
  
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Failed to load form. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadForm();
  }, [id]);
  
  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/embed/form/${id}`;
    const resultsUrl = `${baseUrl}/embed/results/${id}`;
    
    let iframeSrc = formUrl;
    if (embedOptions.showResults || embedOptions.showAnalytics) {
      const params = new URLSearchParams();
      if (embedOptions.showResults) params.append('responses', 'true');
      if (embedOptions.showAnalytics) params.append('analytics', 'true');
      iframeSrc = `${resultsUrl}?${params.toString()}`;
    }
    
    return `<iframe
  src="${iframeSrc}"
  width="${embedOptions.width}"
  height="${embedOptions.height}"
  frameborder="0"
  style="border: none;"
  title="Embedded Form"
></iframe>`;
  };
  
  const copyToClipboard = () => {
    const embedCode = generateEmbedCode();
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        // You might want to show a success toast here
        console.log('Embed code copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy embed code:', err);
      });
  };
  
  if (loading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2">{error}</p>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Form not found</h2>
        <p className="mt-2">This form may have been removed or is no longer available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Embed Form: {form.name}</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Embed Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResults"
                checked={embedOptions.showResults}
                onChange={(e) => setEmbedOptions(prev => ({
                  ...prev,
                  showResults: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="showResults" className="ml-2">
                Show Results
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showAnalytics"
                checked={embedOptions.showAnalytics}
                onChange={(e) => setEmbedOptions(prev => ({
                  ...prev,
                  showAnalytics: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="showAnalytics" className="ml-2">
                Show Analytics
              </label>
            </div>
            
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                id="theme"
                value={embedOptions.theme}
                onChange={(e) => setEmbedOptions(prev => ({
                  ...prev,
                  theme: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                Width
              </label>
              <input
                type="text"
                id="width"
                value={embedOptions.width}
                onChange={(e) => setEmbedOptions(prev => ({
                  ...prev,
                  width: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                Height
              </label>
              <input
                type="text"
                id="height"
                value={embedOptions.height}
                onChange={(e) => setEmbedOptions(prev => ({
                  ...prev,
                  height: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Embed Code</h2>
        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{generateEmbedCode()}</code>
          </pre>
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Copy Code
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={`${window.location.origin}/embed/form/${id}`}
            width={embedOptions.width}
            height={embedOptions.height}
            frameBorder="0"
            style={{ border: 'none' }}
            title="Form Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedCode; 