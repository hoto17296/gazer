import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<p>Loading...</p>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
