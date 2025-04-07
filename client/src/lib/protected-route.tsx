import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { createElement } from "react";

export function ProtectedRoute({
  path,
  component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          navigate("/auth");
          return null;
        }

        // Use createElement to ensure proper rendering of the component
        return createElement(component, params);
      }}
    </Route>
  );
}