// src/main.ts
import { createApp } from "vue";
import "./assets/styles/theme.css"; // Importante
import App from "./App.vue";

// Esta linha ainda é útil para aplicar o tema o mais rápido possível,
// antes mesmo do Vue montar completamente e o `onMounted` do `useTheme` rodar.
const initialTheme = localStorage.getItem("theme") || "light";
if (initialTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  document.documentElement.removeAttribute("data-theme");
}

createApp(App).mount("#app");
