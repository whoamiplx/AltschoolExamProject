import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

// Define the Todo interface
interface Todo {
  id: string;
  title: string;
  message: string;
  userId: string;
  completed: boolean;
}

// Define the error response interface
interface ErrorResponse {
  message: string;
}

const TodoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTodo = async () => {
      if (!id) {
        setError('Todo ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<Todo>(`/api/todos/${id}`);
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
      const response = await axios.put<Todo>(`/api/todos/${todo.id}`, updatedTodo);
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