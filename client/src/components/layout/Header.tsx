import { Bell, Search, User } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>
        <span className="text-sm text-muted-foreground hidden md:block">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search trips, vehicles, crew..." 
            className="pl-9 bg-secondary/50 border-transparent focus:bg-background focus:border-primary" 
          />
        </div>
        
        <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border border-card"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">Dispatch Admin</p>
            <p className="text-xs text-muted-foreground">Operations</p>
          </div>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">DA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
