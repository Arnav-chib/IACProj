import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getForm, getFormResponses, deleteFormResponse, updateResponseApproval } from '../../services/formService';
import { updateFieldApproval, formatFieldValue, isFieldApproved, parseFieldValue } from '../../services/responseService';
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
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [approvingResponse, setApprovingResponse] = useState(null);
  const [fieldApprovals, setFieldApprovals] = useState({});

  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('ResponseView: Fetching form and responses for formId:', formId);
        // Fetch form and responses in parallel
        const [formData, responseData] = await Promise.all([
          getForm(formId),
          getFormResponses(formId)
        ]);
        
        console.log('ResponseView: Response data received:', responseData);
        console.log('ResponseView: Form data received:', formData);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setForm(formData);
          // Ensure responseData is always an array
          const processedResponses = Array.isArray(responseData) ? responseData : 
                         (responseData?.responses ? responseData.responses : 
                          (responseData?.data ? responseData.data : []));
          
          console.log('ResponseView: Setting processed responses:', processedResponses);
          setResponses(processedResponses);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          setError(`Failed to load form responses: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [formId]);

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setIsViewModalOpen(true);
  };
  
  const handleApproveClick = (response) => {
    setApprovingResponse(response);
    // Initialize field approvals based on current state
    const initialApprovals = {};
    if (form && form.fields) {
      form.fields.forEach(field => {
        if (field.needsApproval) {
          // Parse the field value to get current approval status
          let isApproved = false;
          try {
            const value = response.values[field.id];
            if (value && typeof value === 'object') {
              isApproved = value.isApproved || false;
            } else if (typeof value === 'string' && value.startsWith('{')) {
              const parsed = JSON.parse(value);
              isApproved = parsed.isApproved || false;
            }
          } catch (e) {
            console.error('Error parsing field value:', e);
          }
          initialApprovals[field.id] = isApproved;
        }
      });
    }
    setFieldApprovals(initialApprovals);
    setIsApproveModalOpen(true);
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
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete response';
      toast.error(errorMsg);
    }
  };
  
  const handleApprovalChange = (fieldId) => {
    setFieldApprovals(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  const handleApproveSubmit = async () => {
    try {
      // Get a list of fields that need approval
      const fieldsRequiringApproval = form.fields.filter(f => f.needsApproval);
      
      console.log('Submitting field approvals:', fieldApprovals);
      console.log('Fields requiring approval:', fieldsRequiringApproval);
      
      // Update each field's approval status
      const updatePromises = fieldsRequiringApproval.map(field => {
        console.log(`Updating approval for field ${field.id}: ${fieldApprovals[field.id]}`);
        return updateFieldApproval(
          formId,
          approvingResponse.id,
          field.id,
          fieldApprovals[field.id] || false
        );
      });
      
      await Promise.all(updatePromises);
      
      // Update the response in the local state to reflect the new approval statuses
      setResponses(prevResponses => {
        return prevResponses.map(response => {
          if (response.id === approvingResponse.id) {
            // Create a deep copy of the response
            const updatedResponse = { ...response };
            updatedResponse.values = { ...response.values };
            
            // Update approval status for each field
            fieldsRequiringApproval.forEach(field => {
              const currentValue = response.values[field.id];
              
              if (field.type === 'richtext') {
                try {
                  // For rich text fields
                  if (typeof currentValue === 'string' && currentValue.startsWith('{')) {
                    const parsed = JSON.parse(currentValue);
                    parsed.isApproved = fieldApprovals[field.id] || false;
                    updatedResponse.values[field.id] = JSON.stringify(parsed);
                  }
                } catch (e) {
                  console.error('Error updating rich text approval:', e);
                }
              } else {
                // For other field types
                try {
                  const { value: extractedValue } = parseFieldValue(currentValue, field.type);
                  updatedResponse.values[field.id] = JSON.stringify({
                    value: extractedValue,
                    isApproved: fieldApprovals[field.id] || false
                  });
                } catch (e) {
                  console.error('Error updating field approval:', e);
                }
              }
            });
            
            return updatedResponse;
          }
          return response;
        });
      });
      
      toast.success('Approval status updated successfully');
      setIsApproveModalOpen(false);
    } catch (err) {
      console.error('Error updating approval status:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to update approval status';
      toast.error(errorMsg);
    }
  };

  // Function to check if a field is approved
  const checkApprovalStatus = (field, value) => {
    if (!field.needsApproval) {
      return true;
    }
    
    try {
      return isFieldApproved(value, field);
    } catch (e) {
      console.error('Error checking approval status:', e, field, value);
      return false;
    }
  };

  // Function to extract the actual value from a field that has approval status
  const extractFieldValue = (value, fieldType) => {
    try {
      const { value: extractedValue } = parseFieldValue(value, fieldType);
      return extractedValue;
    } catch (e) {
      console.error('Error extracting field value:', e);
      return value;
    }
  };

  // Function to get the file URL from a file field value
  const getFileUrl = (value) => {
    if (!value) return null;
    
    try {
      // If value is a string that looks like JSON, try to parse it
      if (typeof value === 'string' && value.startsWith('{')) {
        const parsed = JSON.parse(value);
        
        // Handle different formats of file data
        if (parsed.url) return parsed.url;
        if (parsed.value && parsed.value.url) return parsed.value.url;
        if (parsed.filePath) return parsed.filePath;
        if (parsed.value && parsed.value.filePath) return parsed.value.filePath;
      }
      
      // If value is already an object
      if (typeof value === 'object') {
        if (value.url) return value.url;
        if (value.filePath) return value.filePath;
      }
      
      // If nothing else works, return the value itself if it's a string
      return typeof value === 'string' ? value : null;
    } catch (e) {
      console.error('Error getting file URL:', e, value);
      return null;
    }
  };

  // Function to format response values based on field type
  const formatValue = (field, value) => {
    if (value === undefined || value === null) {
      return '-';
    }
    
    try {
      return formatFieldValue(value, field);
    } catch (e) {
      console.error('Error formatting field value:', e);
      return String(value);
    }
  };
  
  // Check if the form has any fields that need approval
  const hasApprovalFields = form && form.fields ? form.fields.some(field => field.needsApproval) : false;

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
                {form && form.fields && form.fields.map(field => (
                  <th key={field.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.name}
                    {field.needsApproval && <span className="ml-1 text-xs text-blue-500">(Needs Approval)</span>}
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(responses) && responses.map((response, index) => (
                <tr key={response.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(response.submittedAt).toLocaleString()}
                  </td>
                  {form && form.fields && form.fields.map(field => (
                    <td key={`${response.id}-${field.id}`} className="px-6 py-4 text-sm text-gray-500">
                      {formatValue(field, response.values[field.id])}
                      {field.needsApproval && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          checkApprovalStatus(field, response.values[field.id]) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {checkApprovalStatus(field, response.values[field.id]) ? 'Approved' : 'Pending'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewResponse(response)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    {hasApprovalFields && (
                      <button
                        onClick={() => handleApproveClick(response)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approve
                      </button>
                    )}
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
              {form && form.fields && form.fields.map(field => {
                // Skip rendering fields that need approval but aren't approved
                if (field.needsApproval && !checkApprovalStatus(field, selectedResponse.values[field.id])) {
                  return null;
                }
                
                // Extract the actual value
                const displayValue = extractFieldValue(selectedResponse.values[field.id], field.type);
                
                return (
                  <div key={field.id} className="border-b pb-2">
                    <h4 className="font-medium text-gray-700">
                      {field.name}
                      {field.needsApproval && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Approved</span>
                      )}
                    </h4>
                    <div className="mt-1">
                      {field.type === 'file' ? (
                        (() => {
                          const fileUrl = getFileUrl(selectedResponse.values[field.id]);
                          if (!fileUrl) return <p>No file uploaded</p>;
                          
                          return (
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Uploaded File
                            </a>
                          );
                        })()
                      ) : field.type === 'richtext' ? (
                        <div className="prose">
                          {/* Render rich text content safely */}
                          {(() => {
                            try {
                              if (displayValue && displayValue.content) {
                                return <div dangerouslySetInnerHTML={{ 
                                  __html: displayValue.content.blocks?.map(b => {
                                    // Basic XSS protection for user-generated content
                                    const text = String(b.text || '')
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;');
                                    return text;
                                  }).join('<br/>') || '' 
                                }} />;
                              }
                              return <p>{String(displayValue)}</p>;
                            } catch (e) {
                              return <p>{String(selectedResponse.values[field.id] || '')}</p>;
                            }
                          })()}
                        </div>
                      ) : (
                        <p>{formatValue(field, selectedResponse.values[field.id])}</p>
                      )}
                    </div>
                  </div>
                );
              })}
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
      
      {/* Approve Response Modal */}
      {isApproveModalOpen && approvingResponse && (
        <Modal
          title="Approve Response Fields"
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
        >
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Approval Status for Response #{approvingResponse.id}
            </h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {form && form.fields && form.fields
                .filter(field => field.needsApproval)
                .map(field => {
                  const currentValue = approvingResponse.values[field.id];
                  const isCurrentlyApproved = checkApprovalStatus(field, currentValue);
                  
                  return (
                    <div key={field.id} className="border-b pb-4">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700">
                            {field.name}
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              fieldApprovals[field.id] 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {fieldApprovals[field.id] ? 'Approved' : 'Pending'}
                            </span>
                          </h4>
                          <div className="mt-2 bg-gray-50 p-2 rounded">
                            {field.type === 'richtext' ? (
                              <div className="prose prose-sm max-w-none">
                                {(() => {
                                  try {
                                    const extractedValue = extractFieldValue(currentValue, field.type);
                                    if (extractedValue && extractedValue.content) {
                                      return <div dangerouslySetInnerHTML={{ 
                                        __html: extractedValue.content.blocks?.map(b => {
                                          // Basic XSS protection for user-generated content
                                          const text = String(b.text || '')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;');
                                          return text;
                                        }).join('<br/>') || '' 
                                      }} />;
                                    }
                                    return <p>{String(extractedValue)}</p>;
                                  } catch (e) {
                                    console.error('Error rendering rich text:', e);
                                    return <p>{String(currentValue || '')}</p>;
                                  }
                                })()}
                              </div>
                            ) : (
                              <p>{formatValue(field, currentValue)}</p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 mt-1">
                          <input
                            type="checkbox"
                            id={`approve-${field.id}`}
                            checked={fieldApprovals[field.id] || false}
                            onChange={() => handleApprovalChange(field.id)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`approve-${field.id}`} className="sr-only">
                            Approve {field.name}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                onClick={() => setIsApproveModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApproveSubmit}
                variant="primary"
              >
                Save Approval Status
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
