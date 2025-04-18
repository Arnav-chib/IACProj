import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInput from '../TextInput';

describe('TextInput Component', () => {
  const defaultProps = {
    id: 'test-input',
    label: 'Test Label',
    value: '',
    onChange: jest.fn()
  };

  test('renders with label and input', () => {
    render(<TextInput {...defaultProps} />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('shows required indicator when required is true', () => {
    render(<TextInput {...defaultProps} required={true} />);
    
    const label = screen.getByText('Test Label');
    expect(label.nextSibling).toHaveTextContent('*');
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'This field is required';
    render(<TextInput {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies error styles when error is provided', () => {
    render(<TextInput {...defaultProps} error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  test('calls onChange when input value changes', () => {
    render(<TextInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New value' } });
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('New value');
  });
});
