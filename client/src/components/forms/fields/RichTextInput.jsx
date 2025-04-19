import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import PropTypes from 'prop-types';

const RichTextInput = ({ id, label, value, onChange, required, error, needsApproval, isFormCreator, disabled }) => {
  console.log(`RichTextInput rendering for ${id}:`, { value, needsApproval, isFormCreator, disabled });
  
  // Reference to the editor for focus management
  const editorRef = useRef(null);
  
  // Track if we're currently editing to prevent loops
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize editor state from value prop, handling different formats
  const [editorState, setEditorState] = useState(() => {
    try {
      if (value && typeof value === 'string') {
        if (value.startsWith('{')) {
          try {
            // Parse as JSON - might be raw content or with approval status
            const parsedValue = JSON.parse(value);
            
            // Handle different structures
            if (parsedValue.value && parsedValue.value.content) {
              return EditorState.createWithContent(convertFromRaw(parsedValue.value.content));
            } else if (parsedValue.content) {
              return EditorState.createWithContent(convertFromRaw(parsedValue.content));
            }
            return EditorState.createWithContent(convertFromRaw(parsedValue));
          } catch (e) {
            console.error('Error parsing rich text content:', e, value);
            // If parsing fails, use as plain text
            return EditorState.createWithContent(ContentState.createFromText(value));
          }
        } else {
          // Plain text
          return EditorState.createWithContent(ContentState.createFromText(value));
        }
      }
    } catch (e) {
      console.error('Error initializing editor state:', e);
    }
    
    // Default to empty editor
    return EditorState.createEmpty();
  });

  const [isApproved, setIsApproved] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Parse the approval status from value on component mount or when value changes
  useEffect(() => {
    // Only update if the value has actually changed and we're not in the middle of editing
    if (value !== localValue && !isEditing) {
      setLocalValue(value);
      
      try {
        if (value && typeof value === 'string' && value.startsWith('{')) {
          const parsedValue = JSON.parse(value);
          
          // Update approval status
          if (parsedValue.isApproved !== undefined) {
            setIsApproved(parsedValue.isApproved);
          } else if (parsedValue.value && parsedValue.value.isApproved !== undefined) {
            setIsApproved(parsedValue.value.isApproved);
          }
          
          // Update editor state if content exists
          if (parsedValue.content) {
            // Preserve selection state when updating content
            const currentSelection = editorState.getSelection();
            const newState = EditorState.createWithContent(convertFromRaw(parsedValue.content));
            setEditorState(
              EditorState.forceSelection(newState, currentSelection)
            );
          } else if (parsedValue.value && parsedValue.value.content) {
            // Preserve selection state when updating content
            const currentSelection = editorState.getSelection();
            const newState = EditorState.createWithContent(convertFromRaw(parsedValue.value.content));
            setEditorState(
              EditorState.forceSelection(newState, currentSelection)
            );
          }
        } else if (value && typeof value === 'string') {
          // Plain text - preserve selection
          const currentSelection = editorState.getSelection();
          const newState = EditorState.createWithContent(ContentState.createFromText(value));
          setEditorState(
            EditorState.forceSelection(newState, currentSelection)
          );
        }
      } catch (e) {
        console.error('Error parsing value in useEffect:', e);
      }
    }
  }, [value, localValue, editorState, isEditing]);

  // Focus management
  const handleEditorFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditorBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Debounced editor change handler with improved selection state management
  const handleEditorChange = useCallback((newState) => {
    console.log(`Editor changed for ${id}`);
    
    // Ensure we're in editing mode
    setIsEditing(true);
    
    // Update local state immediately - this preserves cursor position
    setEditorState(newState);
    
    // Capture the raw content
    const rawContent = convertToRaw(newState.getCurrentContent());
    
    // Build the new value object with content and approval status
    const newValue = {
      content: rawContent,
      isApproved
    };
    
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    // Send the value change to parent component
    const valueString = JSON.stringify(newValue);
    setLocalValue(valueString);
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      onChange(valueString);
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition);
    });
  }, [id, isApproved, onChange]);

  // Handle approval checkbox changes
  const handleApprovalChange = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newApproved = e.target.checked;
    setIsApproved(newApproved);
    
    // Update value with new approval status
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const newValue = {
      content: rawContent,
      isApproved: newApproved
    };
    
    const valueString = JSON.stringify(newValue);
    setLocalValue(valueString);
    onChange(valueString);
  }, [editorState, onChange]);

  // Stop propagation of key events to prevent form submission
  const handleKeyDown = useCallback((e) => {
    // Allow normal editor key operation but stop propagation
    e.stopPropagation();
  }, []);

  // Read-only state based on disabled prop
  const isReadOnly = disabled;

  return (
    <div className="mb-4" onKeyDown={handleKeyDown}>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
        {needsApproval && <span className="text-blue-500 ml-1">(Requires Approval)</span>}
      </label>
      
      <div 
        className={`border rounded p-2 bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
        onClick={e => e.stopPropagation()}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onEditorStateChange={handleEditorChange}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          wrapperClassName="rich-text-wrapper"
          editorClassName="rich-text-editor min-h-[200px]"
          toolbarClassName="rich-text-toolbar"
          toolbar={{
            options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'image', 'remove', 'history'],
            inline: { inDropdown: true },
            list: { inDropdown: true },
            textAlign: { inDropdown: true },
          }}
          readOnly={isReadOnly}
          stripPastedStyles={false}
          handlePastedText={(text, html, editorState) => false} // Let default paste behavior work
          handleReturn={e => {
            e.stopPropagation(); // Prevent form submission
            return false; // Let editor handle return normally
          }}
          preserveSelectionOnBlur={true}
          spellCheck={true}
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
            Approve Content (for viewing in responses)
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
  isFormCreator: PropTypes.bool,
  disabled: PropTypes.bool
};

RichTextInput.defaultProps = {
  value: '',
  required: false,
  error: null,
  needsApproval: false,
  isFormCreator: false,
  disabled: false
};

// Use memo to prevent unnecessary re-renders
export default memo(RichTextInput); 