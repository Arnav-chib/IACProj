import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';

const AboutUs = () => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      const response = await axios.get('/api/system/about');
      setContent(response.data.data.content);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching About Us content:', error);
      toast.error('Failed to load About Us content');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put('/api/system/about', { content });
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

      {isEditing ? (
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
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default AboutUs; 