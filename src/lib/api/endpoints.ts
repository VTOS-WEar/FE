export const endpoints = {
    auth: {
        login: "/api/Auth/login",
        verifyEmail: "/api/Auth/verify-email",
        resendOtp: "/api/Auth/resend-otp",
        register: "/api/Auth/register",
        forgotPassword: "/api/Auth/forgot-password",
        resetPassword: "/api/Auth/reset-password",
        changePasswordTeRequest: "/api/Auth/change-password/request-otp",
        changePassword: "/api/Auth/change-password",
    },
    admin: {
        users: "/api/admin/users",
        feedbacks: "/api/admin/feedbacks",
    },
    public: {
        schools: "/api/public/schools",
        categories: "/api/public/categories",
        outfits: "/api/public/outfits/{$id}",

    },
    tryOn: {
        guest: "/api/tryOn/guest",
    },
    schools: {
        me: "/api/schools/me",
        logo: "/api/schools/me/logo",
        students: "/api/schools/me/students",
        importTemplate: "/api/schools/me/students/import/template",
        importStudents: "/api/schools/me/students/import",
    },
} as const;