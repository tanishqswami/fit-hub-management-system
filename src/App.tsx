
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin routes
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminMemberships from "./pages/admin/Memberships";

// Trainer routes
import TrainerDashboard from "./pages/trainer/Dashboard";

// Member routes
import MemberDashboard from "./pages/member/Dashboard";
import MemberFeedback from "./pages/member/Feedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/memberships" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminMemberships />
                </ProtectedRoute>
              } 
            />
            
            {/* Trainer Routes */}
            <Route 
              path="/trainer" 
              element={
                <ProtectedRoute allowedRoles={["trainer"]}>
                  <TrainerDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Member Routes */}
            <Route 
              path="/member" 
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/member/feedback" 
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberFeedback />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
