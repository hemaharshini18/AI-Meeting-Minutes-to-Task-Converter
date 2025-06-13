import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add console logs for debugging
console.log("main.tsx is executing");

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found! Creating a fallback element.");
    const fallbackRoot = document.createElement("div");
    fallbackRoot.id = "root";
    document.body.appendChild(fallbackRoot);
    
    createRoot(fallbackRoot).render(<App />);
  } else {
    console.log("Root element found, rendering app");
    createRoot(rootElement).render(<App />);
  }
} catch (error) {
  console.error("Error rendering the application:", error);
  
  // Create a fallback UI for critical errors
  const errorDiv = document.createElement("div");
  errorDiv.style.padding = "20px";
  errorDiv.style.margin = "20px";
  errorDiv.style.backgroundColor = "#ffebee";
  errorDiv.style.border = "1px solid #f44336";
  errorDiv.style.borderRadius = "4px";
  
  errorDiv.innerHTML = `
    <h1 style="color: #d32f2f; margin-bottom: 10px;">Application Error</h1>
    <p>There was a problem loading the application. Please try refreshing the page.</p>
    <pre style="background: #f5f5f5; padding: 10px; overflow: auto; margin-top: 10px;">${error instanceof Error ? error.message : String(error)}</pre>
    <button style="background: #2196f3; color: white; border: none; padding: 8px 16px; margin-top: 10px; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Reload Page</button>
  `;
  
  document.body.appendChild(errorDiv);
}
