import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
          <div className="max-w-md rounded-[28px] border border-rose-200 bg-white p-8 text-center shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-500">The frontend hit an unexpected runtime issue. Please refresh the page and try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
