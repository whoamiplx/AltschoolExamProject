import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get<Todo[]>('/api/todos');
        setTodos(response.data);
        setError('');
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else if (axiosError.message) {
          setError(axiosError.message);
        } else {
          setError('Failed to fetch todos');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await axios.delete(`/api/todos/${todoId}`);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else if (axiosError.message) {
        setError(axiosError.message);
      } else {
        setError('Failed to delete todo');
      }
    }
  };

  const handleToggleComplete = async (todoId: string) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === todoId);
      if (!todoToUpdate) return;

      const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };
      const response = await axios.put<Todo>(`/api/todos/${todoId}`, updatedTodo);
      
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === todoId ? response.data : todo
        )
      );
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
      <div className="todo-list-container">
        <div className="loading">Loading todos...</div>
      </div>
    );
  }

  return (
    <main className="todo-list-container">
      <div className="todo-list-wrapper">
        <h1>Todo List</h1>
        
        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {todos.length === 0 ? (
          <div className="no-todos">
            <p>No todos found. Create your first todo!</p>
          </div>
        ) : (
          <div className="todos-grid">
            {todos.map(todo => (
              <div key={todo.id} className={`todo-card ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-header">
                  <h3 className="todo-title">
                    <Link to={`/todo/${todo.id}`} className="todo-link">
                      {todo.title}
                    </Link>
                  </h3>
                  <span className={`status-badge ${todo.completed ? 'completed' : 'pending'}`}>
                    {todo.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                
                <p className="todo-message">{todo.message}</p>
                
                <div className="todo-meta">
                  <span className="user-id">User: {todo.userId}</span>
                </div>
                
                <div className="todo-actions">
                  <button 
                    onClick={() => handleToggleComplete(todo.id)}
                    className={`btn ${todo.completed ? 'btn-secondary' : 'btn-primary'}`}
                    aria-label={todo.completed ? 'Mark as pending' : 'Mark as complete'}
                  >
                    {todo.completed ? 'Mark Pending' : 'Mark Complete'}
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="btn btn-danger"
                    aria-label={`Delete ${todo.title}`}
                  >
                    Delete
                  </button>
                  
                  <Link 
                    to={`/todo/${todo.id}`} 
                    className="btn btn-outline"
                    aria-label={`View details for ${todo.title}`}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="add-todo-section">
          <Link to="/create" className="btn btn-primary btn-large">
            Create New Todo
          </Link>
        </div>
      </div>
    </main>
  );
};

export default TodoList;