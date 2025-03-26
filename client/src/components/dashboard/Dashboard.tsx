import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from '../../contexts/FormContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { forms, loadForms, deleteForm, isLoading, error } = useForm();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleDeleteClick = (formId: string) => {
    setFormToDelete(formId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setFormToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (formToDelete) {
      await deleteForm(formToDelete);
      handleCloseDeleteDialog();
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            My Forms
          </Typography>

          {user?.subscription !== 'FREE' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/forms/new"
            >
              Create New Form
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {user?.subscription === 'FREE' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Upgrade your subscription to create forms.
          </Alert>
        )}

        {forms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No forms yet
            </Typography>
            {user?.subscription !== 'FREE' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                component={Link}
                to="/forms/new"
                sx={{ mt: 2 }}
              >
                Create Your First Form
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.title}</TableCell>
                    <TableCell>{formatDate(form.createdAt)}</TableCell>
                    <TableCell>{formatDate(form.updatedAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Form">
                        <IconButton 
                          component={Link} 
                          to={`/forms/${form.id}/view`}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {user?.subscription !== 'FREE' && (
                        <>
                          <Tooltip title="Edit Form">
                            <IconButton 
                              component={Link} 
                              to={`/forms/${form.id}/edit`}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Responses">
                            <IconButton 
                              component={Link} 
                              to={`/forms/${form.id}/responses`}
                              color="primary"
                            >
                              <BarChartIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Form">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteClick(form.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this form? This action cannot be undone and all responses will be deleted as well.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 