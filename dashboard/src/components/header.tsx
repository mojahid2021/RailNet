"use client";

import { Bell, Search, LogOut, User, Menu, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const breadcrumbs = pathname
    .split("/")
    .filter((path) => path)
    .map((path) => path.charAt(0).toUpperCase() + path.slice(1));

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
      {/* Left Section: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        
        <nav className="hidden md:flex items-center text-sm text-muted-foreground">
          <div className="flex items-center hover:text-foreground transition-colors cursor-pointer">
            <Home className="h-4 w-4 mr-1" />
            <span className="font-medium">Dashboard</span>
          </div>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              <span className={`font-medium ${index === breadcrumbs.length - 1 ? "text-foreground" : "hover:text-foreground transition-colors cursor-pointer"}`}>
                {crumb}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section: Search, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search..."
            className="w-64 pl-10 bg-muted/50 focus:bg-background transition-all duration-300 border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 rounded-full"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/80 transition-colors rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse"></span>
        </Button>
        
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 pl-2 pr-4 rounded-full hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-primary ring-2 ring-background shadow-sm">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:flex flex-col items-start text-sm">
                  <span className="font-semibold leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : "Admin User"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {user?.role || "Administrator"}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 p-2 bg-muted/30 rounded-md">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : "Admin User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground break-all">
                  {user?.email || "admin@railnet.com"}
                </p>
                {!user && !loading && (
                  <p className="text-xs text-amber-500 mt-1 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Backend offline
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-muted/50">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md mt-1">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}