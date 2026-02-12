import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                    <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full overflow-auto border border-red-500/30">
                        <p className="text-xl mb-2 font-semibold">Error:</p>
                        <pre className="text-red-300 mb-4 whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</pre>
                        <p className="text-xl mb-2 font-semibold">Stack Trace:</p>
                        <pre className="text-gray-400 text-sm whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="mt-6 px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold"
                    >
                        Return to Dashboard
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
