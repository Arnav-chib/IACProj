import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getForm } from '../../services/formService';
import { getPublicApiUrl } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const ShareForm = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState('');
  const [embedOptions, setEmbedOptions] = useState({
    width: '100%',
    height: '600px'
  });
  const [usingLocalhost, setUsingLocalhost] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const formData = await getForm(formId);
        setForm(formData);
        
        // Check if we're using localhost
        const origin = window.location.origin;
        setUsingLocalhost(origin.includes('localhost') || origin.includes('127.0.0.1'));
      } catch (err) {
        console.error('Error fetching form:', err);
        setError('Failed to load form. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const getPublicFormUrl = () => {
    // First try to use the environment variable if set
    if (process.env.REACT_APP_PUBLIC_URL) {
      return `${process.env.REACT_APP_PUBLIC_URL}/forms/${formId}`;
    }
    
    // For local development, try to use the local IP if on same network
    const origin = window.location.origin;
    
    // If already using IP address rather than localhost, it might work on same network
    if (origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/)) {
      console.log('Using IP address for sharing:', origin);
      return `${origin}/forms/${formId}`;
    }
    
    // When localhost is used, show the warning but still provide the URL
    return `${origin}/forms/${formId}`;
  };

  const getEmbedCode = () => {
    return `<iframe
  src="${getPublicFormUrl()}"
  width="${embedOptions.width}"
  height="${embedOptions.height}"
  frameborder="0"
  style="border: none;"
  title="${form ? form.name : 'Embedded Form'}"
></iframe>`;
  };

  const copyToClipboard = (text, item) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setCopiedItem(item);
        setTimeout(() => {
          setCopied(false);
          setCopiedItem('');
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium text-gray-900">Form not found</h2>
        <Link to="/dashboard" className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{form.name} - Share Form</h2>
        <Link to="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>

      {usingLocalhost && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Local Development Warning</p>
          <p>You are sharing from a localhost environment. The form may not be accessible from other devices because:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Localhost (127.0.0.1) only refers to the current device, not accessible from other devices</li>
            <li>Using your device's local IP address (like 192.168.x.x) works only for devices on the same network</li>
            <li>Firewalls and security settings may block incoming connections</li>
            <li>The server needs CORS configured to accept requests from external origins</li>
          </ul>
          <p className="mt-2">Alternatives:</p>
          <ul className="list-disc pl-5">
            <li>Configure <code>REACT_APP_PUBLIC_URL</code> in your .env file with your local IP address</li>
            <li>Use ngrok to create a secure tunnel to your localhost</li>
            <li>Deploy your application to a public hosting service</li>
          </ul>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Public Form Link</h3>
        <p className="mb-2 text-gray-600">Share this link with people to let them fill out your form:</p>
        
        <div className="flex items-center mb-4">
          <input
            type="text"
            value={getPublicFormUrl()}
            className="flex-grow border rounded-l-md py-2 px-3"
            readOnly
          />
          <button
            onClick={() => copyToClipboard(getPublicFormUrl(), 'link')}
            className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700"
          >
            {copied && copiedItem === 'link' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Anyone with this link can view and submit the form without needing to log in.</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Embed Form</h3>
        <p className="mb-2 text-gray-600">You can also embed this form on your website:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
            <input
              type="text"
              value={embedOptions.width}
              onChange={(e) => setEmbedOptions(prev => ({ ...prev, width: e.target.value }))}
              className="border rounded-md py-2 px-3 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
            <input
              type="text"
              value={embedOptions.height}
              onChange={(e) => setEmbedOptions(prev => ({ ...prev, height: e.target.value }))}
              className="border rounded-md py-2 px-3 w-full"
            />
          </div>
        </div>
        
        <div className="relative mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Embed Code</label>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{getEmbedCode()}</code>
          </pre>
          <button
            onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
            className="absolute top-8 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            {copied && copiedItem === 'embed' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Preview</h4>
          <div className="border rounded-lg p-1">
            <iframe
              src={getPublicFormUrl()}
              width={embedOptions.width}
              height={embedOptions.height}
              frameBorder="0"
              style={{ border: 'none' }}
              title="Form Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareForm; 