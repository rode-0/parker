import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import QuoteBuilder from "./pages/QuoteBuilder";
import QuoteList from "./pages/QuoteList";
import Import from "./pages/Import";
import Customers from "./pages/Customers";
import CustomerImport from "./pages/CustomerImport";
import CustomerMap from "./pages/CustomerMap";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quotes/new" element={<QuoteBuilder />} />
          <Route path="quotes" element={<QuoteList />} />
          <Route path="import" element={<Import />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/import" element={<CustomerImport />} />
          <Route path="customers/map" element={<CustomerMap />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
