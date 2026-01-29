import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserRoleProvider } from "@/contexts/UserRoleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SplashScreen from "@/components/SplashScreen";
import Homepage from "./pages/Homepage";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import SlideshowGenerator from "./pages/SlideshowGenerator";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
// UGCLanding removed - Lastr only has Account Managers
import AMLanding from "./pages/AMLanding";
import ApplicationPending from "./pages/ApplicationPending";
import NotFound from "./pages/NotFound";
import LogoAnimations from "./pages/LogoAnimations";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ContentGuide from "./pages/ContentGuide";
import SlideshowGuide from "./pages/SlideshowGuide";
import AdminResendContracts from "./pages/AdminResendContracts";
import AdminLastrContracts from "./pages/AdminLastrContracts";
import EmailSender from "./pages/EmailSender";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserRoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SplashScreen>
          <BrowserRouter>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/logo-animations" element={<LogoAnimations />} />
            {/* Redirect /creators to /account-managers for Lastr */}
            <Route path="/creators" element={<AMLanding />} />
            <Route path="/account-managers" element={<AMLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/content-guide" element={<ContentGuide />} />
            <Route path="/slideshow-guide" element={<SlideshowGuide />} />

            {/* Application pending route (protected but special case) */}
            <Route path="/application-pending" element={<ProtectedRoute><ApplicationPending /></ProtectedRoute>} />

            {/* Protected routes - Dashboard with sub-routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/account" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/creators" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/leaderboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/am-payouts" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/slideshow-generator" element={<ProtectedRoute><SlideshowGenerator /></ProtectedRoute>} />
            <Route path="/admin/resend-contracts" element={<ProtectedRoute><AdminResendContracts /></ProtectedRoute>} />
            <Route path="/admin/lastr-contracts" element={<ProtectedRoute><AdminLastrContracts /></ProtectedRoute>} />
            <Route path="/admin/email-sender" element={<ProtectedRoute><EmailSender /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </SplashScreen>
      </TooltipProvider>
    </UserRoleProvider>
  </QueryClientProvider>
);

export default App;
