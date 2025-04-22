import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/firebaseInit"; // Import the firebase initialization

createRoot(document.getElementById("root")!).render(<App />);
