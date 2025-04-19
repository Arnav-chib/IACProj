import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load components for better code splitting
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ApiTokens = lazy(() => import('./components/dashboard/ApiTokens'));
const ResponseView = lazy(() => import('./components/dashboard/ResponseView'));
const ShareForm = lazy(() => import('./components/dashboard/ShareForm'));
const FormRenderer = lazy(() => import('./components/forms/FormRenderer'));
const AboutUs = lazy(() => import('./components/AboutUs'));
const BlogList = lazy(() => import('./components/blog/BlogList'));
const BlogDetail = lazy(() => import('./components/blog/BlogDetail'));
const BlogForm = lazy(() => import('./components/blog/BlogForm'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-2xl font-semibold text-gray-700">Loading...</div>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes,
      onError: (error) => {
        console.error('React Query error:', error);
      }
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin only route component
const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (!currentUser || !currentUser.isSystemAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/forms/:formId" element={<FormRenderer />} />
              <Route path="/about" element={<AboutUs />} />
              
              {/* Admin only routes - MOVED ABOVE slug route to prevent matching issues */}
              <Route 
                path="/blog/new" 
                element={
                  <AdminRoute>
                    <BlogForm />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/blog/edit/:id" 
                element={
                  <AdminRoute>
                    <BlogForm />
                  </AdminRoute>
                } 
              />
              
              {/* Blog routes - these must come AFTER the specific routes */}
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/tokens" 
                element={
                  <ProtectedRoute>
                    <ApiTokens />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/forms/:formId/responses" 
                element={
                  <ProtectedRoute>
                    <ResponseView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/forms/:formId/share" 
                element={
                  <ProtectedRoute>
                    <ShareForm />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect root to dashboard or login */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              {/* 404 route */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-xl text-gray-600">Page not found</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

export default App;
