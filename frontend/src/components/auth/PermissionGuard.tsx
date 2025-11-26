import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';

interface PermissionGuardProps {
    permission?: string;
    roles?: UserRole[];
    fallback?: ReactNode;
    children: ReactNode;
}

export function PermissionGuard({ permission, roles, fallback, children }: PermissionGuardProps) {
    const { canAccessResource, hasAnyRole } = usePermissions();

    let hasAccess = true;

    if (permission) {
        hasAccess = canAccessResource(permission);
    } else if (roles) {
        hasAccess = hasAnyRole(roles);
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback || null}</>;
}
