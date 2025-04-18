import React, { useState } from 'react';
import TextInput from './TextInput';
import Dropdown from './Dropdown';
import Button from '../../common/Button';

const GroupField = ({ 
  id, 
  label, 
  columns, 
  columnConfig, 
  rows = 1, 
  canAddRows = false, 
  value = [], 
  onChange, 
  error = null 
}) => {
  // Initialize with default rows if value is empty
  const [groupRows, setGroupRows] = useState(() => {
    if (value.length > 0) return value;
    
    // Initialize with empty rows
    const initialRows = [];
    for (let i = 0; i < rows; i++) {
      const rowData = {};
      columnConfig.forEach(col => {
        rowData[col.key] = '';
      });
      initialRows.push(rowData);
    }
    return initialRows;
  });

  // Update a cell value
  const updateCell = (rowIndex, columnKey, cellValue) => {
    const updatedRows = [...groupRows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [columnKey]: cellValue
    };
    setGroupRows(updatedRows);
    onChange(updatedRows);
  };

  // Add a new row
  const addRow = () => {
    const newRow = {};
    columnConfig.forEach(col => {
      newRow[col.key] = '';
    });
    const updatedRows = [...groupRows, newRow];
    setGroupRows(updatedRows);
    onChange(updatedRows);
  };

  // Remove a row
  const removeRow = (rowIndex) => {
    const updatedRows = groupRows.filter((_, index) => index !== rowIndex);
    setGroupRows(updatedRows);
    onChange(updatedRows);
  };

  // Render a cell based on column type
  const renderCell = (row, rowIndex, column) => {
    const key = `${id}-${rowIndex}-${column.key}`;
    const cellValue = row[column.key] || '';
    
    switch (column.type) {
      case 'text':
        return (
          <TextInput
            id={key}
            value={cellValue}
            onChange={(value) => updateCell(rowIndex, column.key, value)}
            placeholder={column.placeholder || ''}
          />
        );
      case 'dropdown':
        return (
          <Dropdown
            id={key}
            options={column.options || []}
            value={cellValue}
            onChange={(value) => updateCell(rowIndex, column.key, value)}
            placeholder={column.placeholder || 'Select...'}
          />
        );
      default:
        return (
          <TextInput
            id={key}
            value={cellValue}
            onChange={(value) => updateCell(rowIndex, column.key, value)}
            placeholder={column.placeholder || ''}
          />
        );
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="border border-gray-300 rounded-md overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-300">
          {columnConfig.map((column) => (
            <div
              key={`header-${column.key}`}
              className={`col-span-${12 / columns} px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
            >
              {column.label}
            </div>
          ))}
          {/* Empty column for action buttons */}
          {canAddRows && (
            <div className="col-span-1 px-4 py-2"></div>
          )}
        </div>
        
        {/* Table Body */}
        {groupRows.map((row, rowIndex) => (
          <div 
            key={`row-${rowIndex}`} 
            className={`grid grid-cols-12 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            {columnConfig.map((column) => (
              <div
                key={`cell-${rowIndex}-${column.key}`}
                className={`col-span-${12 / columns} px-4 py-2`}
              >
                {renderCell(row, rowIndex, column)}
              </div>
            ))}
            {/* Remove row button */}
            {canAddRows && groupRows.length > 1 && (
              <div className="col-span-1 px-4 py-2 flex items-center">
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Add Row Button */}
      {canAddRows && (
        <div className="mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={addRow}
          >
            Add Row
          </Button>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default GroupField;
