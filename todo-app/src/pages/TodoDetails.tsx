import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

interface Todo {
  id: string;
  title: string;
  message: string;
  userId: string;
  completed: boolean;
}

interface ErrorResponse {
  message: string;
}

// ============================================
// DUMMY API IMPLEMENTATION
// ============================================

// Mock data store
const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    message: 'Write comprehensive documentation for the new API endpoints including examples and error codes',
    userId: 'user123',
    completed: false
  },
  {
    id: '2',
    title: 'Review pull requests',
    message: 'Review and approve pending pull requests from the team',
    userId: 'user456',
    completed: true
  },
  {
    id: '3',
    title: 'Update dependencies',
    message: 'Update all npm packages to their latest stable versions and test for breaking changes',
    userId: 'user123',
    completed: false
  },
  {
    id: '4',
    title: 'Fix bug in authentication',
    message: 'Resolve the JWT token refresh issue reported by QA team',
    userId: 'user789',
    completed: true
  }
];

// Mock API functions
const mockApi = {
  getTodo: (id: string): Promise<Todo> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const todo = mockTodos.find(t => t.id === id);
        if (todo) {
          resolve({ ...todo });
        } else {
          reject({
            response: {
              data: { message: `Todo with id ${id} not found` },
              status: 404
            }
          });
        }
      }, 500); // Simulate network delay
    });
  },

  updateTodo: (id: string, updatedTodo: Todo): Promise<Todo> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockTodos.findIndex(t => t.id === id);
        if (index !== -1) {
          mockTodos[index] = updatedTodo;
          resolve({ ...updatedTodo });
        } else {
          reject({
            response: {
              data: { message: `Todo with id ${id} not found` },
              status: 404
            }
          });
        }
      }, 300); // Simulate network delay
    });
  }
};

// ============================================
// AXIOS INTERCEPTORS FOR DUMMY API
// ============================================

// Set up axios interceptors to intercept requests and use mock API
const setupMockInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Check if this is a todo API request
      if (config.url?.startsWith('/api/todos/')) {
        // Mark this request as mocked
        config.headers['X-Mock-Request'] = 'true';
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle mock requests
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // Check if this is a mock request that hasn't been handled
      if (config?.headers?.['X-Mock-Request'] === 'true' && !config._retry) {
        config._retry = true;
        
        const urlParts = config.url.split('/');
        const todoId = urlParts[urlParts.length - 1];
        
        try {
          let data;
          
          if (config.method === 'get') {
            data = await mockApi.getTodo(todoId);
          } else if (config.method === 'put') {
            const updatedTodo = JSON.parse(config.data);
            data = await mockApi.updateTodo(todoId, updatedTodo);
          }
          
          // Return successful mock response
          return { data, status: 200, statusText: 'OK', headers: {}, config };
        } catch (mockError) {
          // Return the mock error
          return Promise.reject(mockError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize mock interceptors (call this once in your app)
setupMockInterceptors();

// ============================================
// ORIGINAL COMPONENT WITH DUMMY API OPTION
// ============================================

const TodoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Toggle this to switch between real API and mock API
  const USE_MOCK_API = true; // Set to false to use real API

  useEffect(() => {
    const fetchTodo = async () => {
      if (!id) {
        setError('Todo ID is required');
        setLoading(false);
        return;
      }

      try {
        let response;
        
        if (USE_MOCK_API) {
          // Use mock API directly
          const data = await mockApi.getTodo(id);
          response = { data };
        } else {
          // Use real API with axios (interceptors will handle mocking if needed)
          response = await axios.get<Todo>(`/api/todos/${id}`);
        }
        
        setTodo(response.data);
        setError('');
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else if (axiosError.message) {
          setError(axiosError.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [id]);

  const handleToggleComplete = async () => {
    if (!todo) return;

    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      let response;
      
      if (USE_MOCK_API) {
        // Use mock API directly
        const data = await mockApi.updateTodo(todo.id, updatedTodo);
        response = { data };
      } else {
        // Use real API with axios
        response = await axios.put<Todo>(`/api/todos/${todo.id}`, updatedTodo);
      }
      
      setTodo(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else if (axiosError.message) {
        setError(axiosError.message);
      } else {
        setError('Failed to update todo');
      }
    }
  };

  if (loading) {
    return (
      <div className="todo-detail-container">
        <div className="loading">Loading todo details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="todo-detail-container" role="alert" aria-live="assertive">
        <div className="todo-detail-wrapper">
          <p className="error-message">{error}</p>
          <Link to="/" className="back-button">Back to Todo List</Link>
        </div>
      </main>
    );
  }

  if (!todo) {
    return (
      <main className="todo-detail-container" role="alert" aria-live="assertive">
        <div className="todo-detail-wrapper">
          <p className="error-message">Todo not found</p>
          <Link to="/" className="back-button">Back to Todo List</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="todo-detail-container">
      <div className="todo-detail-wrapper">
        {USE_MOCK_API && (
          <div className="mock-indicator" style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffc107', 
            padding: '8px', 
            marginBottom: '16px',
            borderRadius: '4px'
          }}>
            ⚠️ Using Mock API (Test Mode)
          </div>
        )}
        <h1>{todo.title}</h1>
        <div className="todo-content">
          <p className="todo-message">{todo.message}</p>
          <div className="todo-meta">
            <p className="todo-status">
              Status: <span className={todo.completed ? 'completed' : 'pending'}>
                {todo.completed ? 'Completed' : 'Pending'}
              </span>
            </p>
            <p className="todo-user">User ID: {todo.userId}</p>
          </div>
        </div>
        <div className="todo-actions">
          <button 
            onClick={handleToggleComplete}
            className={`toggle-btn ${todo.completed ? 'mark-pending' : 'mark-complete'}`}
          >
            {todo.completed ? 'Mark as Pending' : 'Mark as Complete'}
          </button>
          <Link to="/" className="back-button">Back to Todo List</Link>
        </div>
      </div>
    </main>
  );
};

export default TodoDetails;