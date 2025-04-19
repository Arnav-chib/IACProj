import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        console.log('Fetching blog posts...');
        const response = await api.get('/blog');
        console.log('Blog posts response:', response.data);
        setPosts(response.data.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        toast.error('Failed to load blog posts');
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
    
    // Simplified debugging focused on isSystemAdmin property
    console.log('Current user in BlogList:', {
      isAuthenticated: !!currentUser,
      isSystemAdmin: currentUser?.isSystemAdmin
    });
  }, [currentUser]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getExcerpt = (content, maxLength = 150) => {
    // Strip HTML tags and get plain text
    const plainText = content.replace(/<[^>]+>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blog</h1>
          {currentUser?.isSystemAdmin && (
            <Link
              to="/blog/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Post
            </Link>
          )}
        </div>
        <div className="text-center py-10">
          <h2 className="text-xl font-medium text-gray-900">No blog posts yet</h2>
          <p className="mt-2 text-gray-600">Check back later for updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        {currentUser?.isSystemAdmin && (
          <Link
            to="/blog/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Post
          </Link>
        )}
      </div>

      <div className="space-y-8">
        {posts.map(post => (
          <article key={post.ContentID} className="border-b border-gray-200 pb-8 mb-8 last:border-0">
            <h2 className="text-2xl font-bold mb-2">
              <Link to={`/blog/${post.Slug}`} className="text-gray-900 hover:text-blue-600">
                {post.Title}
              </Link>
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              Published on {formatDate(post.PublishedAt || post.CreatedAt)}
            </div>
            <p className="text-gray-700 mb-4">
              {getExcerpt(post.Content)}
            </p>
            <Link
              to={`/blog/${post.Slug}`}
              className="text-blue-600 hover:text-blue-800"
            >
              Read More →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogList; 