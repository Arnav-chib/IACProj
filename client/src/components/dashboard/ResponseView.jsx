import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getForm, getFormResponses, deleteFormResponse } from '../../services/formService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { Modal } from '../common/Modal';

const ResponseView = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState(null);

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

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (response) => {
    setDeletingResponse(response);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteFormResponse(formId, deletingResponse.id);
      toast.success('Response deleted successfully');
      setIsDeleteModalOpen(false);
      // Remove the deleted response from the list
      setResponses(prev => prev.filter(r => r.id !== deletingResponse.id));
    } catch (err) {
      console.error('Error deleting response:', err);
      toast.error('Failed to delete response');
    }
  };

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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewResponse(response)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteClick(response)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response View Modal */}
      {isViewModalOpen && selectedResponse && (
        <Modal
          title="View Response"
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        >
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Submitted on {new Date(selectedResponse.submittedAt).toLocaleString()}</h3>
            
            <div className="space-y-4">
              {form.fields.map(field => (
                <div key={field.id} className="border-b pb-2">
                  <h4 className="font-medium text-gray-700">{field.name}</h4>
                  <div className="mt-1">
                    {field.type === 'file' ? (
                      <a 
                        href={selectedResponse.values[field.id]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Uploaded File
                      </a>
                    ) : (
                      <p>{formatValue(selectedResponse.values[field.id], field.type)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setIsViewModalOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingResponse && (
        <Modal
          title="Delete Response"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="p-4">
            <p className="mb-4">Are you sure you want to delete this response? This action cannot be undone.</p>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                onClick={() => setIsDeleteModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConfirm}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResponseView;
