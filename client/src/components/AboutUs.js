import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';
import { api } from '../services/api';

const AboutUs = () => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAboutUs();
    
    // Debugging logs
    console.log('Current user:', user);
    console.log('Is system admin?', user?.isSystemAdmin);
  }, []);

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
      await api.put('/system/about', { content });
      setIsEditing(false);
      toast.success('About Us content updated successfully');
    } catch (error) {
      console.error('Error updating About Us content:', error);
      toast.error('Failed to update About Us content');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">About Us</h1>
        {user?.isSystemAdmin && (
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
          <Editor
            apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
            value={content}
            onEditorChange={(content) => setContent(content)}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help'
            }}
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      ) : (
        !error && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )
      )}
    </div>
  );
};

export default AboutUs; 