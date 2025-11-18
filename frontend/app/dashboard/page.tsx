"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserDashboardLayout from "@/components/dashboard/userdashboard-layout";
import AdminDashboardLayout from "@/components/dashboard/admindashboard-layout";

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['user', 'admin']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Render dashboard based on user role
  if (user.role === 'admin') {
    return <AdminDashboardLayout />;
  }

  return <UserDashboardLayout />;
}