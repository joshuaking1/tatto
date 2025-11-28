import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

type ResourcePermissionMap = {
    [key: string]: UserRole[];
};

const PERMISSION_MAP: ResourcePermissionMap = {
    'staff:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'staff:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'staff:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'customer:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST],
    'customer:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST],
    'customer:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'service:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'service:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'service:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'inventory:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'inventory:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'inventory:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'appointment:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.ARTIST],
    'appointment:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.ARTIST],
    'appointment:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'sale:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.RECEPTIONIST],
    'sale:view': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'branch:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'branch:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'branch:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'branch:view': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'payroll:view': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'payroll:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    'reports:view': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'expense:view': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'expense:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'expense:edit': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
    'expense:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
};

export function usePermissions() {
    const role = useAuthStore((state) => state.role);

    const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
        if (!role) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(role as UserRole);
        }

        return role === requiredRole;
    };

    const hasAnyRole = (roles: UserRole[]): boolean => {
        if (!role) return false;
        return roles.includes(role as UserRole);
    };

    const hasAllRoles = (roles: UserRole[]): boolean => {
        if (!role) return false;
        // Since a user can only have one role, this checks if the user's role is in all required roles
        // This is a bit unusual but follows the spec
        return roles.every((r) => r === role);
    };

    const canAccessResource = (resource: string): boolean => {
        if (!role) return false;

        const allowedRoles = PERMISSION_MAP[resource];
        if (!allowedRoles) return false;

        return allowedRoles.includes(role as UserRole);
    };

    return {
        role: role as UserRole | null,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        canAccessResource,
    };
}
