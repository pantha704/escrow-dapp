import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./polyfills";
import "./index.css";
import App from "./App.tsx";
import { WalletContextProvider } from "./WalletProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </StrictMode>
);
