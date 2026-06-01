import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '40px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>We couldn't load this admin page right now. Please refresh or try again later.</p>
          {this.state.error && <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '20px' }}>{this.state.error.toString()}</pre>}
        </div>
      );
    }

    return this.props.children;
  }
}
