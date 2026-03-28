import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  private handleWindowError = (event: ErrorEvent) => {
    event.preventDefault();
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: null
    });
  };

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    this.setState({
      hasError: true,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      errorInfo: null
    });
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      let friendlyMessage = "An unexpected error occurred.";
      let details = this.state.error?.message;

      try {
        if (this.state.error?.message.startsWith('{')) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error?.includes('Missing or insufficient permissions')) {
            friendlyMessage = "You do not have permission to access this data.";
            details = `Access denied to ${parsed.path} (${parsed.operationType})`;
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }

      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
          <div className="bg-[#1C1C1E] p-8 rounded-2xl max-w-md w-full text-center border border-white/10">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
            <p className="text-white/60 mb-6">{friendlyMessage}</p>
            
            {details && (
              <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-h-40 mb-6">
                <code className="text-xs text-red-400 font-mono break-all">
                  {details}
                </code>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
