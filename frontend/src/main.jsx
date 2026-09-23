import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

/* =====================================================
   DISABLE RIGHT CLICK
===================================================== */

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

/* =====================================================
   DISABLE SOME DEVTOOLS SHORTCUTS
===================================================== */

document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey &&
      e.shiftKey &&
      ["I", "J", "C"].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key.toUpperCase() === "U")
  ) {
    e.preventDefault();
  }
});

/* =====================================================
   REACT
===================================================== */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
