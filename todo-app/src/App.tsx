import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TodoList from './pages/TodoList';
import TodoDetails from './pages/TodoDetails';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setCurrentTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`app ${currentTheme}`}>
      <ErrorBoundary>
        <Router>
          <div className="theme-toggle">
            <button onClick={toggleTheme}>
              Switch to {currentTheme === 'light' ? 'dark' : 'light'} mode
            </button>
          </div>
          <Routes>
            <Route path="/" element={<TodoList />} />
            <Route path="/todo/:id" element={<TodoDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
};

export default App;