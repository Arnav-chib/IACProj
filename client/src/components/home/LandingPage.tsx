import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 8 
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Create Forms, Collect Data
              </Typography>
              <Typography variant="h5" paragraph>
                A powerful form builder with conditional logic, group fields, and more.
              </Typography>
              <Box mt={4}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large" 
                  onClick={() => navigate('/register')}
                  sx={{ mr: 2 }}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                boxShadow: 3,
                color: 'text.primary',
                maxWidth: 500,
                mx: 'auto'
              }}>
                <Typography variant="h6" gutterBottom>
                  Sample Form
                </Typography>
                <Box component="form" sx={{ mt: 2 }}>
                  {/* Sample form fields for illustration */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">What's your name?</Typography>
                    <Box sx={{ height: 20 }} />
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">Email address</Typography>
                    <Box sx={{ height: 20 }} />
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Feedback</Typography>
                    <Box sx={{ height: 40 }} />
                  </Paper>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Everything you need to create powerful forms and collect responses
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Form Builder
                </Typography>
                <Typography variant="body1">
                  Build forms with an intuitive drag-and-drop interface. 
                  Add various field types including text, number, date, 
                  select, checkbox, and more.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Conditional Logic
                </Typography>
                <Typography variant="body1">
                  Create dynamic forms with conditional fields that 
                  show or hide based on user responses. Perfect for 
                  complex surveys and questionnaires.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Response Analytics
                </Typography>
                <Typography variant="body1">
                  View and analyze responses with built-in tools. 
                  Export data for further analysis in your preferred 
                  format.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Pricing section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Pricing
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Choose the plan that fits your needs
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Free
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    $0
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body1" paragraph>
                      • View forms only
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • No form creation
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Basic support
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => navigate('/register')}
                  >
                    Sign Up Free
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 6 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Basic
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    $9.99/mo
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body1" paragraph>
                      • Create up to 10 forms
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Basic field types
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Response analytics
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Email support
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/register')}
                  >
                    Start Basic
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Premium
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    $24.99/mo
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body1" paragraph>
                      • Unlimited forms
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • All field types
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Conditional logic
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Advanced analytics
                    </Typography>
                    <Typography variant="body1" paragraph>
                      • Priority support
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary"
                    onClick={() => navigate('/register')}
                  >
                    Go Premium
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 