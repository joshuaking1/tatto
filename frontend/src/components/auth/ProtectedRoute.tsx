// src/components/auth/ProtectedRoute.tsx
import { MainLayout } from "@/components/layout/MainLayout"; // Import MainLayout
import { useAuthStore } from "@/store/authStore";
import { Navigate } from "react-router-dom";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Instead of Outlet, render the MainLayout. 
  // MainLayout has its own Outlet that will handle the child routes.
  return <MainLayout />; 
};

export default ProtectedRoute;