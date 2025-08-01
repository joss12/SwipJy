
import React from "react";
import { createRoot } from "react-dom/client";

function HydratedHome() {
    return <h2>Hydration is working!</h2>;
}

const root = document.getElementById("root");
if (root) {
    createRoot(root).render(<HydratedHome />);
}

