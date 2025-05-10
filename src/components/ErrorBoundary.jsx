import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h3>Đã có lỗi xảy ra trên trang này. Vui lòng thử lại sau.</h3>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;