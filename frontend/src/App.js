import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import useStore from "./store/useStore";

// Create a client
const queryClient = new QueryClient();

function App() {
  const currentUser = useStore(state => state.currentUser);
  const loadInitialData = useStore(state => state.loadInitialData);

  // On initial load, check localStorage for a user
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (!currentUser) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <QueryClientProvider client={queryClient}>
          {/* The Login component will now handle its own logic */}
          <Login />
          <Analytics />
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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