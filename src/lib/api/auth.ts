import { api } from "./clients";
import { endpoints } from "./endpoints";
//#region OTP Email Verification
export type VerifyEmailRequest = {
    email: string;
    otp: string;
};
export type VerifyEmailSuccessResponse = {
    message: string; // ví dụ backend trả: "Email verified successfully"
};
export type VerifyEmailErrorResponse = {
    error?: string;
    message?: string;
    code?: "INVALID_OTP" | "OTP_EXPIRED" | "EMAIL_NOT_FOUND"; // thêm dần nếu có
};
export async function verifyEmail(body: VerifyEmailRequest) {
    return api<VerifyEmailSuccessResponse>(endpoints.auth.verifyEmail, {
        method: "POST",
        body: JSON.stringify({
            email: body.email,
            OTPCode: body.otp, 
        }),
    });
}
//#endregion
//#region Register
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
//#endregion
//#region Login
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
//#endregion 