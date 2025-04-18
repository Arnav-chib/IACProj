import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FormList from './FormList';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {currentUser?.username || 'User'}</h1>
        <p className="mt-2 text-gray-600">
          Manage your forms and responses here.
        </p>
      </div>
      
      <FormList />
      
      <div className="mt-12 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon: Form Builder</h2>
        <p className="text-gray-600">
          The form builder component is coming soon, which will allow you to create custom forms
          with various field types, conditional logic, and more.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
