import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrendingUp, LogOut, User, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import ProfileEditDialog from './ProfileEditDialog';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const disabled = isLoggingIn;

  const handleAuth = async () => {
    if (isAuthenticated) {
      try {
        await clear();
        queryClient.clear();
        toast.success('Logged out successfully');
        // Navigate to homepage after logout
        navigate({ to: '/' });
      } catch (error: any) {
        console.error('Logout error:', error);
        toast.error('Logout failed', {
          description: error.message || 'Unable to logout. Please try again.',
        });
      }
    } else {
      try {
        await login();
        // Success toast is handled in App.tsx after login completes
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error('Login failed', {
          description: error.message || 'Unable to authenticate. Please try again.',
          duration: 5000,
        });
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TradeJournal</h1>
            <p className="text-xs text-muted-foreground">Private Trading Analytics</p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline-block">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userProfile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(userProfile.accountBalance)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ProfileEditDialog />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleAuth}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleAuth} disabled={disabled} className="gap-2">
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
