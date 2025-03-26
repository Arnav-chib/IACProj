import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { FormField, FieldType } from '../../contexts/FormContext';

interface SortableFormFieldProps {
  field: FormField;
  onEdit: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onToggleRequired: (fieldId: string) => void;
}

const SortableFormField: React.FC<SortableFormFieldProps> = ({
  field,
  onEdit,
  onDelete,
  onToggleRequired
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const getFieldTypeLabel = (type: FieldType): string => {
    const typeMap: Record<FieldType, string> = {
      [FieldType.TEXT]: 'Text',
      [FieldType.NUMBER]: 'Number',
      [FieldType.EMAIL]: 'Email',
      [FieldType.DATE]: 'Date',
      [FieldType.TIME]: 'Time',
      [FieldType.CHECKBOX]: 'Checkbox',
      [FieldType.RADIO]: 'Radio',
      [FieldType.SELECT]: 'Select',
      [FieldType.TEXTAREA]: 'Text Area',
      [FieldType.FILE]: 'File Upload',
      [FieldType.GROUP]: 'Group',
      [FieldType.CONDITIONAL]: 'Conditional'
    };
    
    return typeMap[type] || 'Unknown';
  };
  
  const getFieldPreview = () => {
    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.NUMBER:
        return `${field.label} (${getFieldTypeLabel(field.type)} field)`;
        
      case FieldType.SELECT:
      case FieldType.RADIO:
      case FieldType.CHECKBOX:
        return (
          <>
            {field.label} ({getFieldTypeLabel(field.type)} with {field.options?.length || 0} options)
          </>
        );
        
      case FieldType.CONDITIONAL:
        return (
          <>
            {field.label} (Conditional field showing when condition is met)
          </>
        );
        
      default:
        return `${field.label} (${getFieldTypeLabel(field.type)})`;
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        position: 'relative',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box 
          {...attributes} 
          {...listeners} 
          sx={{ cursor: 'grab', mr: 1, color: 'text.secondary' }}
        >
          <DragIcon />
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {field.label}
            {field.required && (
              <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              size="small"
              label={getFieldTypeLabel(field.type)}
              color="primary"
              variant="outlined"
            />
            
            {field.required ? (
              <Chip
                size="small"
                icon={<CheckIcon fontSize="small" />}
                label="Required"
                color="error"
                variant="outlined"
                onClick={() => onToggleRequired(field.id)}
              />
            ) : (
              <Chip
                size="small"
                icon={<ClearIcon fontSize="small" />}
                label="Optional"
                color="default"
                variant="outlined"
                onClick={() => onToggleRequired(field.id)}
              />
            )}
            
            {field.placeholder && (
              <Chip
                size="small"
                label={`Placeholder: ${field.placeholder}`}
                color="default"
                variant="outlined"
              />
            )}
          </Box>
          
          {field.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {field.description}
            </Typography>
          )}
          
          {field.type === FieldType.CONDITIONAL && field.condition && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption">
                Shows when: {field.condition.sourceFieldId} {field.condition.operator} {field.condition.value}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Edit Field">
            <IconButton
              size="small"
              onClick={() => onEdit(field.id)}
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete Field">
            <IconButton
              size="small"
              onClick={() => onDelete(field.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default SortableFormField; 