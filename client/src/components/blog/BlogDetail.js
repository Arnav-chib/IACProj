import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchBlogPost = useCallback(async () => {
    try {
      const response = await api.get(`/system/blog/${slug}`);
      setPost(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast.error('Failed to load blog post');
      setIsLoading(false);
      
      // If post not found, redirect to blog list
      if (error.response && error.response.status === 404) {
        navigate('/blog');
      }
    }
  }, [slug, navigate]);

  useEffect(() => {
    fetchBlogPost();
    
    // Debugging logs with safe access
    console.log('Current user in BlogDetail:', currentUser || 'Not authenticated');
    console.log('Is system admin in BlogDetail?', currentUser?.isSystemAdmin || false);
  }, [fetchBlogPost, currentUser]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await api.delete(`/system/blog/${post.ContentID}`);
        toast.success('Blog post deleted successfully');
        navigate('/blog');
      } catch (error) {
        console.error('Error deleting blog post:', error);
        toast.error('Failed to delete blog post');
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium text-gray-900">Blog post not found</h2>
        <Link to="/blog" className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{post.Title}</h1>
          <div className="mt-2 text-sm text-gray-600">
            <span>Published on {formatDate(post.PublishedAt || post.CreatedAt)}</span>
          </div>
          
          {currentUser?.isSystemAdmin && (
            <div className="mt-4 flex space-x-2">
              <Link
                to={`/blog/edit/${post.ContentID}`}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </header>
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.Content }}
        />
        
        <footer className="mt-8 pt-4 border-t border-gray-200">
          <Link
            to="/blog"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to all posts
          </Link>
        </footer>
      </article>
    </div>
  );
};

export default BlogDetail; 