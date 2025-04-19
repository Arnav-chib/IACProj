import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlogForm = () => {
  // Extract id directly from params without expecting action
  const { id } = useParams();
  const navigate = useNavigate();
  // Check if we're in edit mode based on the existence of id
  const isEditMode = !!id;
  const quillRef = useRef(null);
  
  console.log('BlogForm params:', { id, isEditMode });
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quill editor modules/formats configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean'],
      [{ 'align': [] }],
      ['code-block']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image',
    'align',
    'code-block'
  ];

  const fetchBlogPost = useCallback(async () => {
    try {
      // Fetch the blog post directly by ID
      const response = await axios.get(`/api/system/blog/${id}`);
      const post = response.data.data;
      
      if (post) {
        setFormData({
          title: post.Title,
          slug: post.Slug,
          content: post.Content
        });
      } else {
        toast.error('Blog post not found');
        navigate('/blog');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast.error('Failed to load blog post');
      setIsLoading(false);
      navigate('/blog');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditMode && id) {
      fetchBlogPost();
    }
  }, [isEditMode, id, fetchBlogPost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditorChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  // Generate slug from title
  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-');     // Replace multiple hyphens with single hyphen
    
    setFormData(prev => ({
      ...prev,
      slug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting blog post:', formData);
      
      if (isEditMode) {
        // Fix the PUT endpoint - use contentId instead of id in the URL
        const response = await axios.put(`/api/system/blog/${id}`, formData);
        console.log('Blog update response:', response);
        toast.success('Blog post updated successfully');
      } else {
        const response = await axios.post('/api/system/blog', formData);
        console.log('Blog create response:', response);
        toast.success('Blog post created successfully');
      }
      
      navigate('/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      console.error('API endpoint:', isEditMode ? `/api/system/blog/${id}` : '/api/system/blog');
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      // Provide more helpful error message based on status code
      let errorMessage = 'Failed to save blog post.';
      if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check server routes configuration.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => !formData.slug && generateSlug()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Generate
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Used in the URL: /blog/{formData.slug || '[slug]'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border rounded-lg overflow-hidden">
            <ReactQuill
              ref={quillRef}
              value={formData.content}
              onChange={handleEditorChange}
              modules={modules}
              formats={formats}
              theme="snow"
              className="h-96"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm; 