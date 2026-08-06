export const environment = {
  appName: "my-react-app",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  isProduction: import.meta.env.PROD,
};
