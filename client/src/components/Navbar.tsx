import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LogOut, 
  Plus, 
  Map, 
  Menu, 
  Home,
  Layers
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const userInitials = user.username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const navLinks = [
    { href: "/", label: "Editor", icon: <Layers className="mr-2 h-4 w-4" /> },
    { href: "/dashboard", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
    { href: "/add-tileset", label: "Add Tileset", icon: <Plus className="mr-2 h-4 w-4" /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Map className="h-6 w-6" />
            <span className="font-bold">Tile Map Maker</span>
          </Link>
        </div>

        {isMobile ? (
          <div className="flex flex-1 items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <UserMenu 
              userInitials={userInitials} 
              username={user.username} 
              onLogout={handleLogout} 
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-4 lg:space-x-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant={location === link.href ? "secondary" : "ghost"} 
                    className="flex items-center"
                  >
                    {link.icon}
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
            <UserMenu 
              userInitials={userInitials} 
              username={user.username} 
              onLogout={handleLogout} 
            />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div className="container pb-3">
          <nav className="grid gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button 
                  variant={location === link.href ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function UserMenu({ 
  userInitials, 
  username, 
  onLogout 
}: { 
  userInitials: string; 
  username: string; 
  onLogout: () => void; 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}