import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import LoginPage from "@/pages/login";
import SpinPage from "@/pages/spin";
import WithdrawPage from "@/pages/withdraw";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import NavigationBar from "@/components/NavigationBar";
import { apiRequest } from "./lib/queryClient";
import WinToast from "@/components/WinToast";
import { ThemeProvider } from "next-themes";

function AuthenticatedApp() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={SpinPage} />
          <Route path="/withdraw" component={WithdrawPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <NavigationBar currentPath={location} />
      <WinToast />
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simple and direct auth check with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          console.log("User authenticated:", data);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    // Loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <Toaster />
          {isLoggedIn ? <AuthenticatedApp /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
