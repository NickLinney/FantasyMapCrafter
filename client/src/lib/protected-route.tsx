import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  return (
    <Route path={path}>
      {(params) => <ProtectedComponent Component={Component} params={params} />}
    </Route>
  );
}

function ProtectedComponent({
  Component,
  params,
}: {
  Component: React.ComponentType<any>;
  params: any;
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

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

  return <Component {...params} />;
}