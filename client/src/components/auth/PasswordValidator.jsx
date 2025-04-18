import React from 'react';
import { CheckIcon, XIcon } from '@heroicons/react/solid';

const PasswordValidator = ({ password }) => {
  // Password validation rules
  const rules = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: 'At least one number',
      test: (pwd) => /\d/.test(pwd),
    },
    {
      id: 'special',
      label: 'At least one special character',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    },
  ];

  // Check if all rules are satisfied
  const isPasswordValid = rules.every((rule) => rule.test(password));

  return (
    <div className="mt-2">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
      <ul className="space-y-1">
        {rules.map((rule) => {
          const isValid = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center text-sm">
              {isValid ? (
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XIcon className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span className={isValid ? 'text-green-700' : 'text-red-700'}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
      {password && (
        <div className="mt-2">
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                isPasswordValid
                  ? 'bg-green-500'
                  : password.length > 0
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
              }`}
              style={{
                width: `${Math.min(100, (password.length / 12) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isPasswordValid
              ? 'Password strength: Strong'
              : password.length > 0
              ? 'Password strength: Weak'
              : 'Enter a password'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordValidator; 