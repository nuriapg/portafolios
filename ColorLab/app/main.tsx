import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ColorLab from "@/components/colorlab/color-lab";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorLab />
  </StrictMode>,
);
