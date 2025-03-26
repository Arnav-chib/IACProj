import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Typography,
  Box,
  Divider,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { FormField, FieldType, FieldOption } from '../../contexts/FormContext';
import { getFieldTypeName, fieldSupportsOptions } from '../../utils/formUtils';

// Additional types for text field properties
interface TextFieldProperties {
  minLength?: number;
  maxLength?: number;
}

interface FieldEditorProps {
  open: boolean;
  field: FormField | null;
  availableFields?: FormField[]; // For conditional fields to select source field
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  open,
  field,
  availableFields = [],
  onSave,
  onCancel
}) => {
  const [editedField, setEditedField] = useState<FormField & TextFieldProperties | null>(null);

  useEffect(() => {
    // Deep copy the field for editing
    if (field) {
      setEditedField(JSON.parse(JSON.stringify(field)));
    } else {
      setEditedField(null);
    }
  }, [field]);

  if (!editedField) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedField({ ...editedField, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedField({ ...editedField, [name]: checked });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEditedField({ ...editedField, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : Number(value);
    setEditedField({ ...editedField, [name]: numValue });
  };

  const handleSave = () => {
    if (editedField) {
      // Remove any properties that aren't in the FormField interface
      const { minLength, maxLength, ...cleanedField } = editedField;
      onSave(cleanedField);
    }
  };

  const handleAddOption = () => {
    if (!editedField.options) {
      setEditedField({
        ...editedField,
        options: [{ id: uuidv4(), label: 'New Option', value: `option_${Date.now()}` }]
      });
      return;
    }
    
    setEditedField({
      ...editedField,
      options: [
        ...editedField.options,
        { id: uuidv4(), label: `Option ${editedField.options.length + 1}`, value: `option_${Date.now()}` }
      ]
    });
  };

  const handleDeleteOption = (index: number) => {
    if (!editedField.options) return;
    
    const newOptions = [...editedField.options];
    newOptions.splice(index, 1);
    
    setEditedField({
      ...editedField,
      options: newOptions
    });
  };

  const handleOptionChange = (index: number, field: 'label' | 'value', value: string) => {
    if (!editedField.options) return;
    
    const newOptions = [...editedField.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    setEditedField({
      ...editedField,
      options: newOptions
    });
  };

  const handleConditionChange = (field: string, value: string) => {
    if (!editedField.condition) return;
    
    setEditedField({
      ...editedField,
      condition: {
        ...editedField.condition,
        [field]: value
      }
    });
  };

  // Render field-specific options based on field type
  const renderFieldOptions = () => {
    switch (editedField.type) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.TEXTAREA:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Placeholder"
              name="placeholder"
              value={editedField.placeholder || ''}
              onChange={handleChange}
            />
            {editedField.type === FieldType.TEXT && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Min Length"
                    name="minLength"
                    type="number"
                    value={editedField.minLength || ''}
                    onChange={handleNumberChange}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Max Length"
                    name="maxLength"
                    type="number"
                    value={editedField.maxLength || ''}
                    onChange={handleNumberChange}
                  />
                </Grid>
              </Grid>
            )}
          </>
        );
      
      case FieldType.NUMBER:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Placeholder"
              name="placeholder"
              value={editedField.placeholder || ''}
              onChange={handleChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Min Value"
                  name="min"
                  type="number"
                  value={editedField.min || ''}
                  onChange={handleNumberChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Max Value"
                  name="max"
                  type="number"
                  value={editedField.max || ''}
                  onChange={handleNumberChange}
                />
              </Grid>
            </Grid>
          </>
        );
      
      case FieldType.DATE:
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Min Date"
                name="minDate"
                type="date"
                value={editedField.minDate || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Max Date"
                name="maxDate"
                type="date"
                value={editedField.maxDate || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );
      
      case FieldType.SELECT:
      case FieldType.RADIO:
      case FieldType.CHECKBOX:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">Options</Typography>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={handleAddOption}
              >
                Add Option
              </Button>
            </Box>
            
            {!editedField.options?.length && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No options added yet. Click "Add Option" to create options.
              </Typography>
            )}
            
            {editedField.options?.map((option, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  mb: 1
                }}
              >
                <TextField
                  label="Label"
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="Value"
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeleteOption(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        );
      
      case FieldType.CONDITIONAL:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Condition</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Source Field</InputLabel>
                <Select
                  value={editedField.condition?.sourceFieldId || ''}
                  label="Source Field"
                  onChange={(e) => handleConditionChange('sourceFieldId', e.target.value)}
                >
                  {availableFields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Operator</InputLabel>
                <Select
                  value={editedField.condition?.operator || 'equals'}
                  label="Operator"
                  onChange={(e) => handleConditionChange('operator', e.target.value)}
                >
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="notEquals">Not Equals</MenuItem>
                  <MenuItem value="contains">Contains</MenuItem>
                  <MenuItem value="greaterThan">Greater Than</MenuItem>
                  <MenuItem value="lessThan">Less Than</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Value"
                value={editedField.condition?.value || ''}
                onChange={(e) => handleConditionChange('value', e.target.value)}
                size="small"
              />
            </Stack>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {field ? `Edit ${getFieldTypeName(editedField.type)} Field` : 'Add New Field'}
      </DialogTitle>
      
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Label"
          name="label"
          value={editedField.label}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          name="description"
          value={editedField.description || ''}
          onChange={handleChange}
          multiline
          rows={2}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={editedField.required}
              onChange={handleCheckboxChange}
              name="required"
            />
          }
          label="Required field"
          sx={{ mt: 1 }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        {/* Field-specific options */}
        {renderFieldOptions()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldEditor; 