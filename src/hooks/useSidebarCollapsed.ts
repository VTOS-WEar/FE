import { useState, useCallback } from "react";

const STORAGE_KEY = "vtos_sidebar_collapsed";

/**
 * Shared hook to persist sidebar collapsed state across navigations.
 * Stores the value in localStorage so it survives route changes.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            return false;
        }
    });

    const toggle = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // localStorage unavailable — state still works in memory
            }
            return next;
        });
    }, []);

    return [isCollapsed, toggle];
}
