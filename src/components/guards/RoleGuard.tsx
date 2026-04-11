import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Get the currently logged-in user info from storage, or null if not logged in.
 */
function getCurrentUser(): { userId: string; email: string; fullName: string; role: string } | null {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

interface RoleGuardProps {
    /** Allowed roles. Pass empty array or omit to allow guests (not logged in) only. */
    allowedRoles?: string[];
    /** Also allow guests (not logged in users)? Default: false */
    allowGuest?: boolean;
    /** Where to redirect if access is denied */
    redirectTo?: string;
    children: ReactNode;
}

/**
 * Route guard that checks the user's role.
 * - If user is not logged in and `allowGuest` is false → redirect
 * - If user is logged in but role is not in `allowedRoles` → redirect based on role
 */
export const RoleGuard = ({
    allowedRoles = [],
    allowGuest = false,
    redirectTo,
    children,
}: RoleGuardProps): JSX.Element => {
    const location = useLocation();
    const user = getCurrentUser();

    // Not logged in
    if (!user) {
        if (allowGuest) {
            return <>{children}</>;
        }
        const redirectPath = `${location.pathname}${location.search}`;
        const signInTarget = redirectTo || `/signin?redirect=${encodeURIComponent(redirectPath)}`;
        return <Navigate to={signInTarget} replace />;
    }

    // Logged in — check role
    if (allowedRoles.length > 0 && allowedRoles.includes(user.role)) {
        return <>{children}</>;
    }

    // Role not allowed — redirect based on their actual role
    if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
    }

    // Smart redirect based on role
    if (user.role === "School") {
        return <Navigate to="/school/dashboard" replace />;
    }
    if (user.role === "Admin") {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "Provider") {
        return <Navigate to="/provider/dashboard" replace />;
    }
    return <Navigate to="/homepage" replace />;
};
