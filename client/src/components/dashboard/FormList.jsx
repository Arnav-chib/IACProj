import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getForms } from '../../services/formService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const formList = await getForms();
        setForms(formList);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError('Failed to load forms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

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

  if (forms.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium text-gray-900">No forms yet</h2>
        <p className="mt-2 text-gray-600">
          You don't have any forms yet. The form builder will be available soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Forms</h2>
        <Button variant="primary" disabled>
          Create Form (Coming Soon)
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {forms.map((form) => (
            <li key={form.ID}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{form.Name}</h3>
                  <p className="text-sm text-gray-500">
                    Created on {new Date(form.CreateDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className={form.Status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                      {form.Status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/forms/${form.ID}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Form
                  </Link>
                  <Link
                    to={`/dashboard/forms/${form.ID}/responses`}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    View Responses
                  </Link>
                  <Link
                    to={`/dashboard/forms/${form.ID}/share`}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    Share Form
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FormList;
