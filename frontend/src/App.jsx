import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import useStore from "./store/useStore";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy loading components for better performance
const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Login = React.lazy(() => import("./components/Login"));

// Create optimized React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
          <Suspense fallback={<LoadingSpinner message="Carregando login..." />}>
            <Login />
          </Suspense>
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
            <Suspense fallback={<LoadingSpinner message="Carregando dashboard..." />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Suspense>
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