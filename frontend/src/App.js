import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import useStore from './store/useStore';

// Create a client
const queryClient = new QueryClient();

function App() {
  const { activeProfile, addProfile } = useStore();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  activeProfile ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  activeProfile ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </BrowserRouter>

          {/* Vercel Analytics */}
          <SpeedInsights />
          <Analytics />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;