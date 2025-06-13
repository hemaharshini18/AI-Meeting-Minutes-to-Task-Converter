import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TaskManager from "@/pages/task-manager";

function App() {
  console.log("App component rendering");
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("App component mounted");
    // Simulate checking if everything is loaded
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-700 mb-4">An error occurred while loading the application:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm mb-4">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary setError={setError}>
          {isLoading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading application...</p>
              </div>
            </div>
          ) : (
            <TaskManager />
          )}
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Simple error boundary component
function ErrorBoundary({ children, setError }: { children: React.ReactNode, setError: (error: Error) => void }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setError(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [setError]);

  return <>{children}</>;
}

export default App;
