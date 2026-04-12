const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
console.log("API_BASE:", API_BASE);
export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

function flattenAspNetErrors(errors: any): string | null {
    if (!errors || typeof errors !== "object") return null;

    // errors: { Field: ["msg1", "msg2"], ... }
    const parts: string[] = [];
    for (const key of Object.keys(errors)) {
        const v = errors[key];
        if (Array.isArray(v)) {
            parts.push(...v.filter(Boolean));
        } else if (typeof v === "string") {
            parts.push(v);
        }
    }
    return parts.length ? parts.join("\n") : null;
}

async function parseError(res: Response): Promise<{ message: string; status: number; details?: unknown }> {
    const fallback = `Request failed (${res.status})`;

    try {
        const data = await res.json();

        // ưu tiên message/error trước
        const msg =
            data?.message ||
            data?.error ||
            // ASP.NET validation hay có title + errors
            flattenAspNetErrors(data?.errors) ||
            data?.title ||
            fallback;

        return { message: msg, status: res.status, details: data };
    } catch {
        // nếu backend trả text/html
        try {
            const text = await res.text();
            return { message: text || fallback, status: res.status };
        } catch {
            return { message: fallback, status: res.status };
        }
    }
}

export async function api<T>(
    path: string,
    options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
    // lấy token từ localStorage hoặc sessionStorage (hợp với rememberMe)
    const token =
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const headers = new Headers(options.headers);

    // chỉ set Content-Type khi body là JSON string
    let body = options.body;
    if (!headers.has("Content-Type") && body) {
        if (typeof body === "string") {
            headers.set("Content-Type", "application/json");
        } else if (typeof body === "object" && body !== null) {
            // Plain objects must be stringified; set Content-Type so backend parses as JSON
            body = JSON.stringify(body);
            headers.set("Content-Type", "application/json");
        }
    }

    if (options.auth && token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        body,
        headers,
        // Nếu backend dùng cookie auth:
        // credentials: "include",
    });

    if (!res.ok) {
        // ── Auto-logout on 401 (token expired / invalid) ──
        if (res.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            localStorage.removeItem("expires_in");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("expires_in");
            // Redirect to sign-in (avoid infinite loop if already there)
            if (!window.location.pathname.startsWith("/signin")) {
                window.location.href = "/signin";
            }
            throw new ApiError("Phiên đăng nhập đã hết hạn", 401);
        }

        const err = await parseError(res);
        throw new ApiError(err.message, err.status, err.details);
    }

    // 204 No Content or empty body (some endpoints return 200 with no body) — skip JSON parse
    if (res.status === 204) return null as unknown as T;
    const text = await res.text();
    if (!text) return null as unknown as T;
    return JSON.parse(text) as T;
}
