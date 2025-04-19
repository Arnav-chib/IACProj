import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getForm } from '../../services/formService';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const AnalyticsView = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch form and analytics in parallel
        const formData = await getForm(formId);
        setForm(formData);
        
        try {
          const analyticsResponse = await api.get(`/forms/${formId}/analytics`);
          console.log('Analytics response:', analyticsResponse.data);
          setAnalytics(analyticsResponse.data);
        } catch (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
          toast.error('Failed to load analytics data');
          setError('Analytics data unavailable. Server may not support this feature yet.');
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Form Analytics</h2>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
        
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
          <div className="mt-4">
            <Link 
              to={`/dashboard/forms/${formId}/responses`}
              className="text-blue-600 hover:text-blue-800 mr-4"
            >
              View Responses
            </Link>
            <Link 
              to="/dashboard"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium text-gray-900">Form not found</h2>
        <Link to="/dashboard" className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{form.name} - Analytics</h2>
        <div className="flex space-x-2">
          <Link to={`/dashboard/forms/${formId}/responses`}>
            <Button variant="secondary">View Responses</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {analytics ? (
        <div className="space-y-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Response Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Responses</p>
                <p className="text-2xl font-bold">{analytics.totalResponses || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate || 0}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Average Response Time</p>
                <p className="text-2xl font-bold">{analytics.averageTime || 'N/A'}</p>
              </div>
            </div>
          </div>

          {analytics.fieldStats && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Question Analytics</h3>
              <div className="space-y-6">
                {Object.entries(analytics.fieldStats).map(([fieldId, stats]) => {
                  const field = form.fields.find(f => f.id.toString() === fieldId);
                  if (!field) return null;
                  
                  return (
                    <div key={fieldId} className="border-t pt-4">
                      <h4 className="font-medium">{field.name}</h4>
                      
                      {field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? (
                        <div className="mt-2">
                          <h5 className="text-sm text-gray-500 mb-2">Response Distribution:</h5>
                          {stats.options && (
                            <div className="space-y-2">
                              {Object.entries(stats.options).map(([option, count]) => (
                                <div key={option} className="flex items-center">
                                  <div className="w-48 text-sm">{option}</div>
                                  <div className="flex-1">
                                    <div className="relative h-4 bg-gray-200 rounded">
                                      <div 
                                        className="absolute top-0 left-0 h-4 bg-blue-500 rounded"
                                        style={{ width: `${(count / stats.responseCount) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="w-16 text-right text-sm">{count} ({Math.round((count / stats.responseCount) * 100)}%)</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm">
                          <p>Response Rate: {stats.responseCount} / {analytics.totalResponses} ({Math.round((stats.responseCount / analytics.totalResponses) * 100)}%)</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Analytics Not Available</p>
          <p>The analytics feature may not be supported yet or requires at least one form submission.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView; 