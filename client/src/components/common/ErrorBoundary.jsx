import React, { Component } from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (and possibly a reporting service)
    console.error('Error caught by error boundary:', error, errorInfo);
    
    // Show toast notification
    toast.error('Something went wrong. Please try again or refresh the page.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-xl w-full">
            <h2 className="text-xl font-semibold text-red-700 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">We're sorry, but something went wrong on our end.</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 