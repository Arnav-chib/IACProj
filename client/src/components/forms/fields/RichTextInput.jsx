import React, { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import PropTypes from 'prop-types';

const RichTextInput = ({ id, label, value, onChange, required, error, needsApproval, isFormCreator }) => {
  const [editorState, setEditorState] = useState(() => {
    if (value && typeof value === 'string' && value.startsWith('{')) {
      try {
        // Try to parse as raw content
        const parsedValue = JSON.parse(value);
        if (parsedValue.content) {
          return EditorState.createWithContent(convertFromRaw(parsedValue.content));
        }
        return EditorState.createWithContent(convertFromRaw(parsedValue));
      } catch (e) {
        // If parsing fails, use as plain text
        return EditorState.createWithContent(ContentState.createFromText(value));
      }
    } else if (value) {
      // Use as plain text
      return EditorState.createWithContent(ContentState.createFromText(value));
    }
    // Empty editor
    return EditorState.createEmpty();
  });

  const [isApproved, setIsApproved] = useState(false);

  // Parse the approval status from value on component mount
  useEffect(() => {
    if (value && typeof value === 'string' && value.startsWith('{')) {
      try {
        const parsedValue = JSON.parse(value);
        if (parsedValue.isApproved !== undefined) {
          setIsApproved(parsedValue.isApproved);
        }
      } catch (e) {
        console.error('Error parsing isApproved from value:', e);
      }
    }
  }, [value]);

  const handleEditorChange = (newState) => {
    setEditorState(newState);
    const rawContent = convertToRaw(newState.getCurrentContent());
    
    // Combine the content with approval status
    const newValue = {
      content: rawContent,
      isApproved
    };
    
    onChange(JSON.stringify(newValue));
  };

  const handleApprovalChange = (e) => {
    const newApproved = e.target.checked;
    setIsApproved(newApproved);
    
    // Update value with new approval status
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const newValue = {
      content: rawContent,
      isApproved: newApproved
    };
    
    onChange(JSON.stringify(newValue));
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
        {needsApproval && <span className="text-blue-500 ml-1">(Requires Approval)</span>}
      </label>
      
      <div className="border rounded p-2 bg-white">
        <Editor
          editorState={editorState}
          onEditorStateChange={handleEditorChange}
          wrapperClassName="rich-text-wrapper"
          editorClassName="rich-text-editor min-h-[200px]"
          toolbar={{
            options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'image', 'remove', 'history'],
          }}
        />
      </div>
      
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
      
      {needsApproval && isFormCreator && (
        <div className="mt-2 flex items-center">
          <input
            type="checkbox"
            id={`${id}-approval`}
            checked={isApproved}
            onChange={handleApprovalChange}
            className="mr-2"
          />
          <label htmlFor={`${id}-approval`} className="text-sm text-gray-700">
            Approve
          </label>
        </div>
      )}
    </div>
  );
};

RichTextInput.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  needsApproval: PropTypes.bool,
  isFormCreator: PropTypes.bool
};

RichTextInput.defaultProps = {
  value: '',
  required: false,
  error: null,
  needsApproval: false,
  isFormCreator: false
};

export default RichTextInput; 