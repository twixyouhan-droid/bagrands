import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AudioProvider } from "./lib/audio";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <AudioProvider>
        <App />
      </AudioProvider>
    </StrictMode>,
  );
}
