import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextInput from './TextInput';
import Dropdown from './Dropdown';
import FileInput from './FileInput';
import Button from '../../common/Button';

const GroupField = ({ id, label, value, onChange, columnConfig, rows, canAddRows, error, formValues }) => {
  // Initialize rows data
  const [rowsData, setRowsData] = useState(() => {
    try {
      if (value && typeof value === 'string') {
        return JSON.parse(value);
      }
    } catch (e) {
      console.error('Error parsing group value:', e);
    }
    
    // Default rows structure
    return Array(rows).fill().map(() => {
      const rowData = {};
      columnConfig.columns.forEach(col => {
        rowData[col.id] = '';
      });
      return rowData;
    });
  });

  // Update parent component whenever rows data changes
  useEffect(() => {
    onChange(JSON.stringify(rowsData));
  }, [rowsData, onChange]);

  // Handle field changes within a row
  const handleFieldChange = (rowIndex, columnId, fieldValue) => {
    const updatedRows = [...rowsData];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [columnId]: fieldValue
    };
    setRowsData(updatedRows);
  };

  // Add a new row
  const addRow = () => {
    const newRow = {};
    columnConfig.columns.forEach(col => {
      newRow[col.id] = '';
    });
    setRowsData([...rowsData, newRow]);
  };

  // Remove a row
  const removeRow = (rowIndex) => {
    const updatedRows = rowsData.filter((_, idx) => idx !== rowIndex);
    setRowsData(updatedRows);
  };

  // Render a field based on its type
  const renderField = (rowIndex, column) => {
    const fieldId = `${id}-${rowIndex}-${column.id}`;
    const fieldValue = rowsData[rowIndex][column.id] || '';
    
    // Get field type from column config or default to text
    const fieldType = column.type || 'text';
    
    const commonProps = {
      id: fieldId,
      label: '', // No label for individual fields in group
      value: fieldValue,
      onChange: (value) => handleFieldChange(rowIndex, column.id, value),
      required: false // Handle group-level validation separately
    };
    
    switch (fieldType) {
      case 'dropdown':
        return (
          <Dropdown
            {...commonProps}
            options={column.options || []}
            multiple={column.multiple || false}
          />
        );
      
      case 'file':
        return <FileInput {...commonProps} />;
      
      default:
        return <TextInput {...commonProps} />;
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      
      {/* Group table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-100 flex">
          {columnConfig.columns.map(column => (
            <div 
              key={column.id} 
              className="flex-1 p-2 font-medium text-gray-700 text-sm"
            >
              {column.label}
            </div>
          ))}
          {/* Actions column header */}
          {canAddRows && rowsData.length > 1 && (
            <div className="w-16 p-2"></div>
          )}
        </div>
        
        {/* Table rows */}
        {rowsData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t">
            {columnConfig.columns.map(column => (
              <div key={column.id} className="flex-1 p-2">
                {renderField(rowIndex, column)}
              </div>
            ))}
            
            {/* Actions column */}
            {canAddRows && rowsData.length > 1 && (
              <div className="w-16 p-2 flex items-center">
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove row"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Add row button */}
      {canAddRows && (
        <div className="mt-2">
          <Button
            type="button"
            onClick={addRow}
            className="text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
          >
            Add Row
          </Button>
        </div>
      )}
      
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

GroupField.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  columnConfig: PropTypes.shape({
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  rows: PropTypes.number,
  canAddRows: PropTypes.bool,
  error: PropTypes.string,
  formValues: PropTypes.object
};

GroupField.defaultProps = {
  value: '',
  rows: 1,
  canAddRows: false,
  error: null,
  formValues: {}
};

export default GroupField;
