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
    roleName?: string;
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
    phone?: string | null;
    providerId?: string | null;
};

export type LoginResponse = {
    accessToken: string;
    expiresIn: number;
    user: UserInfo;
    requiresTwoFactor?: boolean;
    requiresTwoFactorSetup?: boolean;
    twoFactorToken?: string;
};

export async function login(payload: LoginRequest) {
    return api<LoginResponse>(endpoints.auth.login, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
//#endregion
//#region Two-Factor Authentication
export type Verify2FARequest = {
    twoFactorToken: string;
    code: string;
};

export type Setup2FAResponse = {
    qrCodeUri: string;
    manualKey: string;
};

export type Confirm2FAResponse = {
    recoveryCodes: string[];
};

export async function verify2FA(payload: Verify2FARequest) {
    return api<LoginResponse>(endpoints.auth.verify2fa, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function setup2FA(accessToken: string) {
    return api<Setup2FAResponse>(endpoints.auth.setup2fa, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function confirm2FA(code: string, accessToken: string) {
    return api<Confirm2FAResponse>(endpoints.auth.confirm2fa, {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function disable2FA(code: string, accessToken: string) {
    return api<{ message: string }>(endpoints.auth.disable2fa, {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}
//#endregion
//#region Resend OTP Email
export async function resendOtpEmail(email: string) {
    return api<{ message: string }>(endpoints.auth.resendOtp, {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}
//#endregion
//#region Forgot Password
export type ForgotPasswordRequest = {
    email: string;
};

export type ForgotPasswordResponse = {
    message: string;
};
export async function forgotPassword(payload: ForgotPasswordRequest) {
    return api<ForgotPasswordResponse>(endpoints.auth.forgotPassword, {
        method: "POST",
        body: JSON.stringify(payload),
    });

}
//#endregion
//#region Reset Password
export type ResetPasswordRequest = {
    token: string;
    newPassword: string;
};
export type ResetPasswordResponse = {
    message: string;
};
export async function resetPassword(payload: ResetPasswordRequest) {
    return api<ResetPasswordResponse>(endpoints.auth.resetPassword, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
//#endregion
//#region Verify Phone
export type VerifyPhoneRequest = {
    phone: string;
};
export type VerifyPhoneChild = {
    childId: string;
    fullName: string;
    age: number;
    grade: string;
    gender: string;
    school: {
        schoolId: string;
        schoolName: string;
        logoURL?: string | null;
    };
};
export type VerifyPhoneResponse = {
    phone: string;
    matchedCount: number;
    children: VerifyPhoneChild[];
    message: string;
};
export async function verifyPhone(payload: VerifyPhoneRequest, accessToken: string) {
    return api<VerifyPhoneResponse>(endpoints.auth.verifyPhone, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });
}
//#endregion