import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Moon, Sun, User, LogOut } from 'lucide-react';

export default function TopBar({ title, darkMode, onToggleDark, onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Burger — only on mobile/tablet */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDark}
          className="text-muted-foreground hover:text-foreground"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {user?.full_name || user?.email || 'User'}
              </span>
              <Badge variant="secondary" className="text-[10px] hidden md:inline-flex">
                {user?.role || 'viewer'}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}