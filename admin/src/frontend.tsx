import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/context/auth-context";
import "./index.css";

const element = document.getElementById("root");
if (!element) throw new Error("Admin root element not found.");

createRoot(element).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
