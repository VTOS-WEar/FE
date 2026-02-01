import { api } from "./clients";
import { endpoints } from "./endpoints";

export type RegisterRequest = {
    email: string;
    password: string;
    fullName: string;
};
export type RegisterResponse = {
    userId: string;
    email: string;
    fullName: string;
    message: string;
};

export async function register(payload: RegisterRequest) {
    return api<RegisterResponse>(endpoints.auth.register, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export type LoginRequest = {
    email: string;
    password: string;
};

export type UserInfo = {
    userId: string;
    email: string;
    fullName: string;
    role: string;
};

export type LoginResponse = {
    accessToken: string;
    expiresIn: number; // thường là giây
    user: UserInfo;
};

export async function login(payload: LoginRequest) {
    return api<LoginResponse>(endpoints.auth.login, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
