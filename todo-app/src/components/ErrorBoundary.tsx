import React, { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            color: '#dc3545',
            backgroundColor: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            margin: '20px',
          }}
        >
          <h1 style={{ color: '#dc3545' }}>Oops! Something went wrong.</h1>
          <p>We're sorry, but there was an unexpected error. Please try refreshing the page.</p>
          {this.state.error && (
            <details
              style={{
                whiteSpace: 'pre-wrap',
                textAlign: 'left',
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#fbe9ea',
                borderRadius: '4px',
                border: '1px solid #efb8c1',
              }}
            >
              <summary>Error Details</summary>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;