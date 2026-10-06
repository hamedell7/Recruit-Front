import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

// Keep the application font explicit at the root so every native and custom element inherits Vazir.
document.documentElement.style.fontFamily = '"Vazir", Tahoma, Arial, sans-serif';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
