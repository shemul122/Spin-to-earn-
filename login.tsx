import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Simple direct login without Firebase
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email) {
      toast({
        title: "Please fill all fields",
        description: "Username and email are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First try to login with existing credentials
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email }),
          credentials: "include"
        });
        
        if (loginResponse.ok) {
          // User exists, login successful
          const data = await loginResponse.json();
          console.log("Login successful:", data);
          
          // Invalidate auth query to refresh user data
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          
          // Call the onLogin callback
          onLogin();
          return;
        }
      } catch (loginError) {
        // Ignore login errors and try signup
        console.log("Login attempt failed, trying signup");
      }
      
      // If login failed, try to create a new account
      const signupResponse = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: `temp-${Date.now()}`,
          email: email,
          username: username,
          profilePic: null,
        }),
        credentials: "include"
      });
      
      if (signupResponse.ok) {
        const data = await signupResponse.json();
        console.log("Signup successful:", data);
        
        // Invalidate auth query to refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Call the onLogin callback
        onLogin();
      } else {
        const errorData = await signupResponse.json();
        toast({
          title: "Login/Signup failed",
          description: errorData.message || "Please try with different username or email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Could not log you in. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container min-h-screen flex flex-col items-center justify-center p-6 text-white bg-gradient-to-br from-primary to-purple-700">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">SpinCash</h1>
          <p className="text-white/80">Spin daily and earn real money</p>
        </div>
        
        <Card className="w-full">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-6 text-center">Log In</h2>
            
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full py-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  "Log In / Sign Up"
                )}
              </Button>
            </form>
            
            <div className="text-sm text-center text-gray-600 mt-4">
              By continuing, you agree to our
              <a href="#" className="text-primary hover:underline"> Terms of Service</a> and
              <a href="#" className="text-primary hover:underline"> Privacy Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
