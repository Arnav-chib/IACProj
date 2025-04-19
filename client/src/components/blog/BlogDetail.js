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
  const { user } = useAuth();

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
  }, [fetchBlogPost]);

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
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
        <Link to="/blog" className="text-blue-600 hover:text-blue-800">
          Return to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Blog
        </Link>
      </div>
      
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.Title}</h1>
          <div className="flex items-center text-gray-500">
            <span>By {post.AuthorName}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.PublishedAt)}</span>
            
            {user?.isSystemAdmin && (
              <div className="ml-auto space-x-3">
                <Link 
                  to={`/blog/edit/${post.ContentID}`}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.Content }}
        />
      </article>
    </div>
  );
};

export default BlogDetail; 