import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PricingProvider } from "./contexts/PricingContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <PricingProvider>
          <App />
        </PricingProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
