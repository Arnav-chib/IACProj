import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';

const EmbedResults = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const includeResponses = searchParams.get('responses') === 'true';
        const includeAnalytics = searchParams.get('analytics') === 'true';
        
        const response = await api.get(`/embed/results/${id}`, {
          params: {
            includeResponses,
            includeAnalytics
          }
        });
        
        setForm(response.data.form);
        if (includeResponses) {
          setResponses(response.data.responses);
        }
        if (includeAnalytics) {
          setAnalytics(response.data.analytics);
        }
      } catch (error) {
        console.error('Error loading results:', error);
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, searchParams]);
  
  const renderFieldValue = (field, value) => {
    if (!value) return '-';
    
    switch (field.type) {
      case 'dropdown':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      case 'group':
        if (Array.isArray(value)) {
          return value.map(row => 
            Object.entries(row)
              .map(([key, val]) => `${key}: ${val}`)
              .join(', ')
          ).join(' | ');
        }
        return JSON.stringify(value);
      default:
        return value;
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2">{error}</p>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Form not found</h2>
        <p className="mt-2">This form may have been removed or is no longer available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">{form.name} - Results</h1>
      
      {analytics && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Responses</p>
              <p className="text-2xl font-bold">{analytics.totalResponses}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Completion Rate</p>
              <p className="text-2xl font-bold">{analytics.completionRate}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Average Time</p>
              <p className="text-2xl font-bold">{analytics.averageTime}s</p>
            </div>
          </div>
        </div>
      )}
      
      {responses.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {form.fields.map(field => (
                  <th
                    key={field.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response, index) => (
                <tr key={index}>
                  {form.fields.map(field => (
                    <td
                      key={field.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {renderFieldValue(field, response.values[field.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No responses yet</p>
        </div>
      )}
    </div>
  );
};

export default EmbedResults; 