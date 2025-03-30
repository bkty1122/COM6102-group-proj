To test whether data built from your FormBuilder can be fetched to a Django backend, let's set up a simple integration between your React frontend and a Django backend. Here's a step-by-step approach:

## 1. Set up a Basic Django Backend

First, let's create a simple Django project with a REST API:

```bash
# Install Django and Django REST framework
pip install django djangorestframework django-cors-headers

# Create a new Django project
django-admin startproject linguo_backend

# Navigate to the project
cd linguo_backend

# Create a new app for handling form builder data
python manage.py startapp question_materials

# Create initial database migrations
python manage.py migrate
```

## 2. Configure Django Settings

Update your Django settings to include REST framework and CORS handling:

```python
# linguo_backend/settings.py

INSTALLED_APPS = [
    # Django default apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    
    # Your apps
    'question_materials',
]

MIDDLEWARE = [
    # Add CORS middleware at the top
    'corsheaders.middleware.CorsMiddleware',
    # Default middleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Configure CORS to allow your React frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
]

# Configure REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
}
```

## 3. Create Django Models

Define models to store your form builder data:

```python
# question_materials/models.py

from django.db import models
from django.contrib.auth.models import User
import json

class QuestionMaterial(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    title = models.CharField(max_length=200)
    exam_language = models.CharField(max_length=50)
    exam_type = models.CharField(max_length=50)  # IELTS, TCF, etc.
    component = models.CharField(max_length=50)  # Reading, Listening, etc.
    status = models.CharField(max_length=20, default='draft')
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_materials')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='updated_materials')
    updated_at = models.DateTimeField(auto_now=True)
    
    # JSON field to store form builder data
    form_data = models.TextField()
    
    def get_form_data(self):
        return json.loads(self.form_data)
    
    def set_form_data(self, data):
        self.form_data = json.dumps(data)
    
    @property
    def question_count(self):
        try:
            data = self.get_form_data()
            # Count the number of questions in form_data
            # This would need to be adjusted based on how your form data is structured
            return sum(len(page.get('cards', [])) for page in data.get('pages', []))
        except:
            return 0
    
    def __str__(self):
        return f"{self.title} ({self.id})"
```

## 4. Create Serializers

Create serializers to convert model instances to JSON:

```python
# question_materials/serializers.py

from rest_framework import serializers
from .models import QuestionMaterial

class QuestionMaterialSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = QuestionMaterial
        fields = [
            'id', 'title', 'exam_language', 'exam_type', 'component', 
            'status', 'created_by', 'created_at', 'updated_by', 
            'updated_at', 'form_data', 'question_count'
        ]

class QuestionMaterialListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    created_by = serializers.StringRelatedField()
    updated_by = serializers.StringRelatedField()
    
    class Meta:
        model = QuestionMaterial
        fields = [
            'id', 'title', 'exam_language', 'exam_type', 'component', 
            'status', 'created_by', 'created_at', 'updated_by', 
            'updated_at', 'question_count'
        ]
```

## 5. Create Views

Set up API views to handle CRUD operations:

```python
# question_materials/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import QuestionMaterial
from .serializers import QuestionMaterialSerializer, QuestionMaterialListSerializer

class QuestionMaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for question materials
    """
    queryset = QuestionMaterial.objects.all().order_by('-updated_at')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return QuestionMaterialListSerializer
        return QuestionMaterialSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get statistics for dashboard
        """
        total = QuestionMaterial.objects.count()
        published = QuestionMaterial.objects.filter(status='published').count()
        drafts = QuestionMaterial.objects.filter(status='draft').count()
        
        languages = QuestionMaterial.objects.values_list('exam_language', flat=True).distinct().count()
        exam_types = QuestionMaterial.objects.values_list('exam_type', flat=True).distinct().count()
        components = QuestionMaterial.objects.values_list('component', flat=True).distinct().count()
        
        return Response({
            'totalMaterials': total,
            'published': published,
            'drafts': drafts,
            'languages': languages,
            'examTypes': exam_types,
            'components': components
        })
```

## 6. Configure URLs

Set up URL routes for your API:

```python
# question_materials/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'materials', views.QuestionMaterialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

```python
# linguo_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken import views as token_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('question_materials.urls')),
    path('api-auth/', include('rest_framework.urls')),
    # Simple token auth for testing
    path('api-token-auth/', token_views.obtain_auth_token),
]
```

## 7. Create a Simple Test API Endpoint

Add a temporary endpoint to test form data submission:

```python
# question_materials/views.py (add to existing file)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_form_submission(request):
    """
    Test endpoint to verify form data submission
    """
    form_data = request.data
    
    # Just echo back the data for testing
    return Response({
        'status': 'success',
        'message': 'Form data received successfully',
        'data_summary': {
            'pages': len(form_data.get('pages', [])),
            'first_page_title': form_data.get('pages', [{}])[0].get('title', 'No title') if form_data.get('pages') else 'No pages',
        },
        'received_data': form_data
    })
```

Add the URL:

```python
# question_materials/urls.py (update existing file)

urlpatterns = [
    path('', include(router.urls)),
    path('test-form-submission/', views.test_form_submission, name='test-form-submission'),
]
```

## 8. Update React Frontend to Test API Integration

Let's add a service to connect to your Django backend:

```javascript
// src/services/apiService.js

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Django backend URL
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Form Builder API Service
export const formBuilderApi = {
  // Test form data submission
  testFormSubmission: async (formData) => {
    try {
      const response = await api.post('/test-form-submission/', formData);
      return response.data;
    } catch (error) {
      console.error('Error testing form submission:', error);
      throw error;
    }
  },
  
  // Get all materials
  getMaterials: async () => {
    try {
      const response = await api.get('/materials/');
      return response.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },
  
  // Get single material by ID
  getMaterial: async (id) => {
    try {
      const response = await api.get(`/materials/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error;
    }
  },
  
  // Create new material
  createMaterial: async (materialData) => {
    try {
      const response = await api.post('/materials/', materialData);
      return response.data;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },
  
  // Update existing material
  updateMaterial: async (id, materialData) => {
    try {
      const response = await api.put(`/materials/${id}/`, materialData);
      return response.data;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  },
  
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await api.get('/materials/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

// Auth API Service
export const authApi = {
  login: async (credentials) => {
    try {
      const response = await axios.post('http://localhost:8000/api-token-auth/', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
};

export default api;
```

## 9. Add a Test Button to Your FormBuilderPage

Modify your FormBuilderPage to include a test button:

```javascript
// src/pages/FormBuilderPage.js - Add this import
import { formBuilderApi } from '../services/apiService';
import { Button, Snackbar, Alert } from '@mui/material';

// Inside your FormBuilderPage component, add these state variables
const [testSubmitLoading, setTestSubmitLoading] = useState(false);
const [testResponse, setTestResponse] = useState(null);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [snackbarSeverity, setSnackbarSeverity] = useState('info');

// Add this function to the component
const handleTestSubmit = async () => {
  setTestSubmitLoading(true);
  try {
    // Get the current form builder data
    const formData = {
      pages: pages.map(page => ({
        id: page.id,
        title: page.title || 'Untitled Page',
        examCategories: page.examCategories || {},
        cards: page.cards || [],
        cardContents: page.cardContents || []
      })),
      metadata: {
        title: pages[0]?.title || 'Untitled Form',
        exam_language: pages[0]?.examCategories?.language || 'English',
        exam_type: pages[0]?.examCategories?.exam_type || 'IELTS',
        component: pages[0]?.examCategories?.component || 'Reading'
      }
    };
    
    const response = await formBuilderApi.testFormSubmission(formData);
    
    setTestResponse(response);
    setSnackbarMessage('Form data successfully sent to the backend!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    
    console.log('Test submission response:', response);
  } catch (error) {
    setSnackbarMessage(`Error testing backend connection: ${error.message}`);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    console.error('Error testing form submission:', error);
  } finally {
    setTestSubmitLoading(false);
  }
};

// Add these to your JSX, right after the TopAppBarLoggedIn component
// ...
<TopAppBarLoggedIn appTitle="Form Builder" />

{/* Test backend connection button */}
<Box sx={{ p: 1, borderBottom: '1px solid #ddd', backgroundColor: '#f8f8f8' }}>
  <Button 
    variant="outlined" 
    color="primary" 
    onClick={handleTestSubmit}
    disabled={testSubmitLoading}
    size="small"
    sx={{ ml: 2 }}
  >
    {testSubmitLoading ? 'Testing...' : 'Test Backend Connection'}
  </Button>
  
  {testResponse && (
    <Typography variant="caption" sx={{ ml: 2 }}>
      Last test: {testResponse.message}
    </Typography>
  )}
</Box>

{/* Snackbar for notifications */}
<Snackbar 
  open={snackbarOpen} 
  autoHideDuration={6000} 
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert 
    onClose={() => setSnackbarOpen(false)} 
    severity={snackbarSeverity}
    variant="filled"
  >
    {snackbarMessage}
  </Alert>
</Snackbar>
// ...
```

## 10. Add Test Login Functionality

Update your LoginPage to use the Django backend for authentication:

```javascript
// src/pages/LoginPage.js - Add this import and update handleSubmit function
import { authApi } from '../services/apiService';

// Replace the existing handleSubmit function with this:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Basic form validation
  if (!credentials.username || !credentials.password) {
    setErrorMessage('Username and password are required.');
    return;
  }
  
  setIsLoading(true);
  setErrorMessage('');
  
  try {
    // Try to authenticate with Django backend
    const response = await authApi.login({
      username: credentials.username,
      password: credentials.password
    });
    
    // Store auth token
    if (rememberMe) {
      localStorage.setItem('authToken', response.token);
    } else {
      sessionStorage.setItem('authToken', response.token);
    }
    
    // Store basic user info
    const userInfo = {
      id: '1', // We don't get user ID from token auth, this is a placeholder
      username: credentials.username,
      role: 'admin',
      name: credentials.username // Use username as name since we don't get the name
    };
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    // Redirect to the page they were trying to visit or default to dashboard
    navigate(from, { replace: true });
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Fallback to mock authentication if we're in development environment
    if (process.env.NODE_ENV === 'development' && 
        credentials.username === 'admin' && 
        credentials.password === 'admin') {
      
      console.log('Using mock authentication for development');
      
      // Store auth token for persistent sessions
      if (rememberMe) {
        localStorage.setItem('authToken', 'temp-mock-auth-token');
      } else {
        sessionStorage.setItem('authToken', 'temp-mock-auth-token');
      }
      
      // Store basic user info
      const userInfo = {
        id: '1',
        username: credentials.username,
        role: 'admin',
        name: 'Administrator'
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // Redirect to the page they were trying to visit or default to dashboard
      navigate(from, { replace: true });
      
    } else {
      // Show actual error
      setErrorMessage(error.response?.data?.non_field_errors?.[0] || 
                      'Authentication failed. Please check your credentials.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

## 11. Update DashboardPage to Fetch Real Data

Modify your DashboardPage to try fetching data from the backend:

```javascript
// src/pages/DashboardPage.js - Add this import
import { formBuilderApi } from '../services/apiService';

// Add these state variables
const [isLoadingData, setIsLoadingData] = useState(true);
const [backendConnected, setBackendConnected] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

// Add this useEffect to fetch data on component mount
useEffect(() => {
  const fetchData = async () => {
    setIsLoadingData(true);
    
    try {
      // Try to get stats from backend
      const statsData = await formBuilderApi.getStats();
      // Set stats data from backend
      // ... update your state with statsData ...
      
      // Try to get materials from backend
      const materialsData = await formBuilderApi.getMaterials();
      // ... update your state with materialsData ...
      
      setBackendConnected(true);
    } catch (error) {
      console.error('Error fetching from backend:', error);
      setErrorMessage('Could not connect to backend, using mock data instead.');
      // Continue using mock data
    } finally {
      setIsLoadingData(false);
    }
  };
  
  fetchData();
}, []);

// Add this to your JSX, just below the dashboard header
{errorMessage && (
  <Alert severity="warning" sx={{ mb: 3 }}>
    {errorMessage}
  </Alert>
)}

{backendConnected && (
  <Alert severity="success" sx={{ mb: 3 }}>
    Successfully connected to the Django backend!
  </Alert>
)}

{isLoadingData ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
    <CircularProgress />
  </Box>
) : (
  // Your existing code for stats cards and tables
  <>
    <StatisticsCards stats={stats} />
    {/* etc. */}
  </>
)}
```

## 12. Run Everything Together

1. Start your Django backend:

```bash
cd linguo_backend
python manage.py runserver
```

2. Create a superuser for testing:

```bash
python manage.py createsuperuser
# Follow the prompts to create a user
```

3. Start your React frontend:

```bash
cd ../frontend  # Navigate to your React app
npm start
```

4. Visit http://localhost:3000 and try logging in with your Django superuser

## Testing the Integration

1. Try logging in with your Django credentials
2. Navigate to the Form Builder
3. Create some form content
4. Click "Test Backend Connection"
5. Check the Django server logs to see the incoming request
6. Check your React console for the response

## Common Issues and Solutions

1. **CORS Errors**: If you see CORS errors in the console, make sure your Django CORS settings are correct.

2. **Authentication Issues**: Make sure you're including the token in your requests.

3. **Data Structure Mismatches**: The form data structure in Django might need adjustments to match your React structure.

4. **Django Server Not Running**: Make sure your Django server is running on port 8000.

## Next Steps

1. **Complete Integration**: Finish integrating your dashboard with real backend data.

2. **Implement Real Authentication**: Set up proper JWT authentication in Django.

3. **Add Form Validation**: Validate form data on both client and server sides.

4. **Expand API Endpoints**: Create more specialized endpoints for your needs.

5. **Add Error Handling**: Improve error handling for different API failure scenarios.

This setup gives you a foundation to test whether your FormBuilder data can be successfully sent to and retrieved from a Django backend. The fallback to mock data ensures your app continues to work during development even if the backend isn't available.