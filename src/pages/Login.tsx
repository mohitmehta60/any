import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        let errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (error.message === "Invalid login credentials") {
          errorMessage = "The email or password you entered is incorrect. Please check your credentials or create an account if you're new.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the confirmation link before signing in.";
        } else if (error.message.includes("signup_disabled")) {
          errorMessage = "Account creation is currently disabled. Please contact support.";
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Update last login
      try {
        const { error: loginError } = await supabase.rpc('update_last_login');
        if (loginError) {
          console.error('Error updating last login:', loginError);
        }
      } catch (loginError) {
        console.error('Error updating last login:', loginError);
      }
      
      // Optionally, fetch user profile data here
      let userName = 'Farmer';
      
      // Try to get name from user metadata first
      if (data.user?.user_metadata?.name) {
        userName = data.user.user_metadata.name;
      } else {
        // Try to fetch from user profile
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', data.user.id)
            .single();
          
          if (profile?.name) {
            userName = profile.name;
          } else {
            // Fallback to email-based name
            userName = email.split('@')[0].replace(/[^a-zA-Z\s]/g, '').replace(/\b\w/g, l => l.toUpperCase()) || 'Farmer';
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          userName = email.split('@')[0].replace(/[^a-zA-Z\s]/g, '').replace(/\b\w/g, l => l.toUpperCase()) || 'Farmer';
        }
      }
      
      localStorage.setItem('userName', userName);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userName}!`,
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Error",
        description: err.message || "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-grass-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <img src="/logo.png" alt="AgriCure Logo" className="h-8 w-8" />
            <span className="text-2xl md:text-3xl font-bold text-grass-800">AgriCure</span>
          </Link>
        </div>
        
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center px-4 md:px-6">
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 text-sm md:text-base">
              Sign in to your AgriCure account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-grass-600 hover:bg-grass-700 text-sm md:text-base py-2 md:py-3"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm md:text-base">
                Don't have an account?{" "}
                <Link to="/signup" className="text-grass-600 hover:text-grass-700 font-medium">
                  Sign up here
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                New to AgriCure? Create an account first to get started with personalized fertilizer recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;