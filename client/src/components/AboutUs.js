import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../services/api';

const AboutUs = () => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const quillRef = useRef(null);

  useEffect(() => {
    fetchAboutUs();
    
    // Simplified debugging focused only on isSystemAdmin which is what we use
    console.log('Current user object:', JSON.stringify({
      id: currentUser?.id,
      email: currentUser?.email,
      isSystemAdmin: currentUser?.isSystemAdmin
    }, null, 2));
  }, [currentUser]); // Add currentUser as dependency

  const fetchAboutUs = async () => {
    try {
      console.log('Fetching About Us content...');
      const response = await api.get('/system/about');
      console.log('About Us response:', response.data);
      setContent(response.data.data ? response.data.data.Content : '');
      setIsLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching About Us content:', error);
      setError('Failed to load About Us content. Please try again.');
      toast.error('Failed to load About Us content');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('Updating About Us content...');
      const response = await api.put('/system/about', { content });
      console.log('Update response:', response);
      setIsEditing(false);
      toast.success('About Us content updated successfully');
    } catch (error) {
      console.error('Error updating About Us content:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      toast.error(`Failed to update About Us content: ${error.response?.data?.message || error.message}`);
    }
  };

  // Quill editor modules/formats configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">About Us</h1>
        {currentUser?.isSystemAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={fetchAboutUs} 
            className="ml-2 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && isEditing ? (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              theme="snow"
              className="h-64 min-h-full"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default AboutUs; 