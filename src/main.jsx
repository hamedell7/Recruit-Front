import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

// Keep the application font explicit at the root so every native and custom element inherits IranYekan.
document.documentElement.style.fontFamily = '"IranYekan", Tahoma, Arial, sans-serif';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
