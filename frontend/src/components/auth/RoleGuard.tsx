import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
    allowedRoles: UserRole[];
    children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const { hasAnyRole } = usePermissions();
    const { isAuthenticated } = useAuthStore();
    const { role } = usePermissions();

    // If no user or no role, redirect to login
    if (!isAuthenticated || !role) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    const hasRequiredRole = hasAnyRole(allowedRoles);

    if (hasRequiredRole) {
        return <>{children}</>;
    }

    // Show 403 Forbidden page
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center p-8">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-red-100 rounded-full">
                        <ShieldAlert className="h-12 w-12 text-red-600" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">403 - Access Forbidden</h1>
                <p className="text-gray-600 mb-8">
                    You don't have sufficient permissions to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <Button asChild>
                    <a href="/">Go to Dashboard</a>
                </Button>
            </div>
        </div>
    );
}
