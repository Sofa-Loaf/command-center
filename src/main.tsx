import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StoreProvider } from "./state/store";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary variant="app">
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
