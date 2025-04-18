import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getForm, getFormResponses } from '../../services/formService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const ResponseView = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch form and responses in parallel
        const [formData, responseData] = await Promise.all([
          getForm(formId),
          getFormResponses(formId)
        ]);
        
        setForm(formData);
        setResponses(responseData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form responses. Please try again.');
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
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
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

  if (responses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{form.name} - Responses</h2>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
        
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <h3 className="text-xl font-medium text-gray-900">No responses yet</h3>
          <p className="mt-2 text-gray-600">
            This form hasn't received any responses yet.
          </p>
          <div className="mt-4">
            <Link 
              to={`/forms/${formId}`}
              className="text-blue-600 hover:text-blue-800"
            >
              View Form
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Function to format response values based on field type
  const formatValue = (value, fieldType) => {
    if (value === null || value === undefined) return '-';
    
    try {
      // Handle values that are stored as JSON strings
      const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      
      if (Array.isArray(parsedValue)) {
        return parsedValue.join(', ');
      }
      
      return parsedValue.toString();
    } catch (e) {
      return value.toString();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{form.name} - Responses</h2>
        <div className="flex space-x-2">
          <Link to={`/dashboard/forms/${formId}/analytics`}>
            <Button variant="secondary">View Analytics</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Date
                </th>
                {form.fields.map(field => (
                  <th key={field.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response, index) => (
                <tr key={response.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(response.submittedAt).toLocaleString()}
                  </td>
                  {form.fields.map(field => (
                    <td key={`${response.id}-${field.id}`} className="px-6 py-4 text-sm text-gray-500">
                      {formatValue(response.values[field.id], field.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponseView;
