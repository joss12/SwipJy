import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../views/home.jsx";

// Grab initial data from the server-side rendering
const props = window.__INITIAL_PROPS__ || {};

const root = createRoot(document.getElementById("root"));
root.render(<Home {...props} />);
