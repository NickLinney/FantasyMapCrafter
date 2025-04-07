import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MapIcon } from "lucide-react";

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Login successful",
        description: "Welcome back to Fantasy Tile Map Maker!",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    try {
      await registerMutation.mutateAsync({
        username: data.username,
        password: data.password,
      });
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Form Column */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your maps and tilesets
                  </CardDescription>
                </CardHeader>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Your password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending || isLoading}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to start creating your fantasy maps
                  </CardDescription>
                </CardHeader>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Choose a password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending || isLoading}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Register"}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Column */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 to-primary/10 items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-primary/10">
              <MapIcon className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Fantasy Tile Map Maker</h1>
          <p className="text-lg mb-6">
            Create beautiful fantasy maps for your games, stories, or worldbuilding projects.
            Choose from various tilesets, use different map types, and organize with layers.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-background/80">
              <h3 className="font-semibold mb-1">Tile Placement</h3>
              <p>Easily place tiles with different brush sizes and tools</p>
            </div>
            <div className="p-3 rounded-lg bg-background/80">
              <h3 className="font-semibold mb-1">Layer Management</h3>
              <p>Organize your map with multiple layers</p>
            </div>
            <div className="p-3 rounded-lg bg-background/80">
              <h3 className="font-semibold mb-1">Export Maps</h3>
              <p>Save your creations as PNG images</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}