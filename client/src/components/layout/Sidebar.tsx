import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Bus, Users, Settings, LogOut, Map, FileText } from "lucide-react";
import logo from "@assets/generated_images/hampton_jitney_logo_concept.png";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: CalendarDays, label: "Lineup", href: "/lineup" },
    { icon: FileText, label: "Paper View", href: "/paper" },
    { icon: Bus, label: "Vehicles", href: "/vehicles" },
    { icon: Users, label: "Crew", href: "/crew" },
    { icon: Map, label: "Live Map", href: "/map" },
    { icon: FileText, label: "Reports", href: "/reports" },
  ];

  return (
    <div className="h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border flex-shrink-0">
      <div className="p-6 flex items-center justify-center border-b border-sidebar-border/50">
        <img 
          src={logo} 
          alt="Hampton Jitney" 
          className="h-10 w-auto object-contain mix-blend-screen opacity-90" 
        />
        {/* Fallback if image fails to load/blend well */}
        <span className="sr-only">Hampton Jitney</span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer group",
                isActive 
                  ? "bg-sidebar-primary text-white shadow-md shadow-sidebar-primary/20" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              )}>
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-white")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground/70 hover:text-white cursor-pointer transition-colors">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 text-destructive/80 hover:text-destructive cursor-pointer transition-colors">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Log Out</span>
        </div>
      </div>
    </div>
  );
}
