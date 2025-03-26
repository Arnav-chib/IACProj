import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  TextFields as TextFieldsIcon,
  Numbers as NumbersIcon,
  Email as EmailIcon,
  CalendarMonth as DateIcon,
  AccessTime as TimeIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioIcon,
  ArrowDropDown as SelectIcon,
  TextSnippet as TextareaIcon,
  Upload as FileIcon,
  FolderZip as GroupIcon,
  CallSplit as ConditionalIcon
} from '@mui/icons-material';
import { useForm } from '../../contexts/FormContext';
import { FormField, FieldType, Form } from '../../contexts/FormContext';
import { createNewField } from '../../utils/formUtils';
import SortableFormField from './SortableFormField';
import FieldEditor from './FieldEditor';

const FormBuilder: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const isNewForm = formId === 'new';
  const navigate = useNavigate();
  
  const { 
    currentForm, 
    getForm, 
    createForm, 
    updateForm, 
    isLoading, 
    error,
    clearCurrentForm
  } = useForm();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [fieldTypeDialogOpen, setFieldTypeDialogOpen] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load form data if editing an existing form
  useEffect(() => {
    if (!isNewForm && formId) {
      getForm(formId);
    } else {
      clearCurrentForm();
    }
  }, [formId, getForm, clearCurrentForm, isNewForm]);

  // Update state when form data is loaded
  useEffect(() => {
    if (currentForm) {
      setTitle(currentForm.title);
      setDescription(currentForm.description || '');
      setFields(currentForm.schema.fields);
    } else if (isNewForm) {
      setTitle('');
      setDescription('');
      setFields([]);
    }
  }, [currentForm, isNewForm]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleOpenFieldTypeDialog = () => {
    setFieldTypeDialogOpen(true);
    setSpeedDialOpen(false);
  };

  const handleCloseFieldTypeDialog = () => {
    setFieldTypeDialogOpen(false);
    setSelectedFieldType(null);
  };

  const handleFieldTypeSelect = (type: FieldType) => {
    setSelectedFieldType(type);
    setFieldTypeDialogOpen(false);
    
    // Create a new field with the selected type
    const newField = createNewField(type, fields.length);
    setEditingField(newField);
    setEditorOpen(true);
  };

  const handleSaveField = (field: FormField) => {
    if (editingField) {
      // Find if we're editing an existing field
      const existingIndex = fields.findIndex(f => f.id === field.id);
      
      if (existingIndex >= 0) {
        // Update existing field
        const updatedFields = [...fields];
        updatedFields[existingIndex] = field;
        setFields(updatedFields);
      } else {
        // Add new field
        setFields([...fields, field]);
      }
    }
    
    setEditorOpen(false);
    setEditingField(null);
  };

  const handleEditField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setEditingField(field);
      setEditorOpen(true);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleToggleRequired = (fieldId: string) => {
    setFields(fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, required: !field.required };
      }
      return field;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex).map((field, index) => ({
          ...field,
          order: index
        }));
      });
    }
  };

  const handleSaveForm = async () => {
    if (!title) {
      setSaveError('Form title is required');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const formData = {
        title,
        description: description || undefined,
        schema: { fields }
      };
      
      if (isNewForm) {
        // Create new form
        const newFormId = await createForm(formData);
        navigate(`/forms/${newFormId}/edit`);
      } else if (formId) {
        // Update existing form
        await updateForm(formId, formData);
      }
    } catch (err) {
      console.error('Error saving form:', err);
      setSaveError('Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (formId && !isNewForm) {
      navigate(`/forms/${formId}/view`);
    } else {
      setSaveError('Please save the form first to preview it');
    }
  };

  if (isLoading && !isNewForm) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const fieldTypeOptions = [
    { type: FieldType.TEXT, icon: <TextFieldsIcon />, label: 'Text' },
    { type: FieldType.NUMBER, icon: <NumbersIcon />, label: 'Number' },
    { type: FieldType.EMAIL, icon: <EmailIcon />, label: 'Email' },
    { type: FieldType.DATE, icon: <DateIcon />, label: 'Date' },
    { type: FieldType.TIME, icon: <TimeIcon />, label: 'Time' },
    { type: FieldType.CHECKBOX, icon: <CheckBoxIcon />, label: 'Checkbox' },
    { type: FieldType.RADIO, icon: <RadioIcon />, label: 'Radio' },
    { type: FieldType.SELECT, icon: <SelectIcon />, label: 'Select' },
    { type: FieldType.TEXTAREA, icon: <TextareaIcon />, label: 'Text Area' },
    { type: FieldType.FILE, icon: <FileIcon />, label: 'File Upload' },
    { type: FieldType.GROUP, icon: <GroupIcon />, label: 'Group' },
    { type: FieldType.CONDITIONAL, icon: <ConditionalIcon />, label: 'Conditional' }
  ];

  const speedDialActions = [
    { icon: <AddIcon />, name: 'Add Field', onClick: handleOpenFieldTypeDialog },
    { icon: <PreviewIcon />, name: 'Preview Form', onClick: handlePreview },
    { icon: <SaveIcon />, name: 'Save Form', onClick: handleSaveForm }
  ];

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isNewForm ? 'Create New Form' : 'Edit Form'}
          </Typography>
          
          {(error || saveError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {saveError || error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Form Title"
                value={title}
                onChange={handleTitleChange}
                required
                error={!title && isSaving}
                helperText={!title && isSaving ? 'Title is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Form Description"
                value={description}
                onChange={handleDescriptionChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h5" gutterBottom>
          Form Fields
        </Typography>
        
        {fields.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              No fields added yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenFieldTypeDialog}
            >
              Add Your First Field
            </Button>
          </Paper>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map(field => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ mb: 3 }}>
                {fields.map((field) => (
                  <SortableFormField
                    key={field.id}
                    field={field}
                    onEdit={handleEditField}
                    onDelete={handleDeleteField}
                    onToggleRequired={handleToggleRequired}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        )}
        
        {/* Speed Dial for actions */}
        <SpeedDial
          ariaLabel="Form Builder Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
        
        {/* Field Type Selection Dialog */}
        <Dialog
          open={fieldTypeDialogOpen}
          onClose={handleCloseFieldTypeDialog}
        >
          <DialogTitle>Select Field Type</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {fieldTypeOptions.map((option) => (
                <Grid item xs={6} key={option.type}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={option.icon}
                    onClick={() => handleFieldTypeSelect(option.type)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1 }}
                  >
                    {option.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFieldTypeDialog}>Cancel</Button>
          </DialogActions>
        </Dialog>
        
        {/* Field Editor Dialog */}
        <FieldEditor
          open={editorOpen}
          field={editingField}
          availableFields={fields}
          onSave={handleSaveField}
          onCancel={() => {
            setEditorOpen(false);
            setEditingField(null);
          }}
        />
      </Box>
    </Container>
  );
};

export default FormBuilder; 