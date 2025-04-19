import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await axios.get('/api/system/blog');
      setPosts(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
      setIsLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await axios.delete(`/api/system/blog/${contentId}`);
        toast.success('Blog post deleted successfully');
        fetchBlogPosts();
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog</h1>
        {user?.isSystemAdmin && (
          <Link
            to="/blog/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Post
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-600 my-12">No blog posts found</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.ContentID} className="border-b pb-6 last:border-0">
              <Link to={`/blog/${post.Slug}`}>
                <h2 className="text-2xl font-semibold hover:text-blue-600 transition-colors">
                  {post.Title}
                </h2>
              </Link>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <span>{post.AuthorName}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(post.PublishedAt)}</span>
              </div>
              <div className="mt-3">
                <p className="text-gray-600">
                  {post.Content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                </p>
              </div>
              <div className="mt-4 flex">
                <Link 
                  to={`/blog/${post.Slug}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Read more →
                </Link>
                
                {user?.isSystemAdmin && (
                  <div className="ml-auto space-x-3">
                    <Link 
                      to={`/blog/edit/${post.ContentID}`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.ContentID)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList; 