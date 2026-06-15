import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./Css/tokens.css";
import "./Css/sidebar.css";
import "./Css/ui.css";
import "./Css/Toast.css";
import "./Css/Checkbox.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
