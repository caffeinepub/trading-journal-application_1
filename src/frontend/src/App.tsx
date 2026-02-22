import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import { Loader2 } from 'lucide-react';

// Layout component for shared header/footer
function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Define routes
const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Homepage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute]);

const router = createRouter({ routeTree });

// Import Outlet after router is created
import { Outlet } from '@tanstack/react-router';

function AppContent() {
  const { identity, isInitializing, loginStatus, isLoginError, loginError } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [hasShownLoginSuccess, setHasShownLoginSuccess] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Handle login success - show success message only once per login
  useEffect(() => {
    if (loginStatus === 'success' && identity && !hasShownLoginSuccess) {
      toast.success('Login successful!', {
        description: 'Welcome to your trading journal.',
        duration: 3000,
      });
      setHasShownLoginSuccess(true);
    }
    
    // Reset the flag when user logs out
    if (!identity) {
      setHasShownLoginSuccess(false);
    }
  }, [loginStatus, identity, hasShownLoginSuccess]);

  // Handle login errors with better error messages
  useEffect(() => {
    if (isLoginError && loginError) {
      // Don't show error for "already authenticated" case
      if (loginError.message !== 'User is already authenticated') {
        toast.error('Login failed', {
          description: loginError.message || 'Unable to authenticate. Please try again.',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
          },
        });
      }
    }
  }, [isLoginError, loginError]);

  // Show minimal loading screen only during initial authentication check
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster richColors closeButton />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}
