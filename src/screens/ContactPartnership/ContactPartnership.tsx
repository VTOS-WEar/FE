import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, CheckCircle2, Home, RefreshCcw, School, Send } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { submitAccountRequest } from "../../lib/api/accountRequests";
import { Checkbox } from "../../components/ui/checkbox";
import { TermsOfUseModal, VTOS_TERMS_VERSION } from "../../components/legal/TermsOfUseModal";

const initialContactForm = {
    organizationName: "",
    contactPersonName: "",
    contactEmail: "",
    contactPhone: "",
    type: 1 as 1 | 2,
    description: "",
    address: "",
};

const successThemes = {
    1: {
        label: "Trường học",
        primary: "#6938EF",
        hover: "#5B21B6",
        soft: "#F3F0FF",
        border: "#DDD6FE",
    },
    2: {
        label: "Nhà cung cấp",
        primary: "#3B82F6",
        hover: "#2563EB",
        soft: "#EFF6FF",
        border: "#BFDBFE",
    },
} as const;

export const ContactPartnership = (): JSX.Element => {
    const [form, setForm] = useState(initialContactForm);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const successTheme = successThemes[form.type];

    const resetSubmission = () => {
        setForm(initialContactForm);
        setError("");
        setAcceptedTerms(false);
        setSubmitted(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.organizationName.trim()) return setError("Vui lòng nhập tên tổ chức");
        if (!form.contactPersonName.trim()) return setError("Vui lòng nhập họ tên người liên hệ");
        if (!form.contactEmail.trim()) return setError("Vui lòng nhập email liên hệ");
        if (!form.contactPhone.trim()) return setError("Vui lòng nhập số điện thoại");

        if (!acceptedTerms) return setError("Vui lòng đọc và đồng ý với Điều khoản sử dụng trước khi gửi yêu cầu.");

        setLoading(true);
        try {
            await submitAccountRequest({
                ...form,
                organizationName: form.organizationName.trim(),
                contactPersonName: form.contactPersonName.trim(),
                contactEmail: form.contactEmail.trim(),
                contactPhone: form.contactPhone.trim(),
                description: form.description.trim() || undefined,
                address: form.address.trim() || undefined,
                acceptedTerms,
                termsVersion: VTOS_TERMS_VERSION,
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err?.message || "Đã xảy ra lỗi, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <GuestLayout bgColor="#f9fafb">
                <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
                    <div className="mx-auto w-full max-w-lg">
                        <div className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-lg">
                            <div className="h-1.5" style={{ backgroundColor: successTheme.primary }} />
                            <div className="px-6 py-8 text-center sm:px-10">
                                <div
                                    className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[8px] border"
                                    style={{
                                        backgroundColor: successTheme.soft,
                                        borderColor: successTheme.border,
                                        color: successTheme.primary,
                                    }}
                                >
                                    <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
                                </div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: successTheme.primary }}>
                                    Yêu cầu {successTheme.label.toLowerCase()}
                                </p>
                                <h1 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 lg:text-3xl">
                                    Yêu cầu đã được gửi
                                </h1>
                                <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-gray-500">
                                    Cảm ơn bạn đã quan tâm đến VTOS. Đội ngũ phụ trách sẽ xem xét thông tin và liên hệ lại trong thời gian sớm nhất.
                                </p>
                                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                    <Link
                                        to="/homepage"
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-5 text-sm font-semibold text-white shadow-soft-sm transition-colors"
                                        style={{ backgroundColor: successTheme.primary }}
                                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = successTheme.hover; }}
                                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = successTheme.primary; }}
                                    >
                                        <Home className="h-4 w-4" />
                                        Về trang chủ
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={resetSubmission}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-soft-sm transition-colors hover:bg-gray-50"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        Gửi yêu cầu khác
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </GuestLayout>
        );
    }

    const inputClass = "nb-input w-full h-11 text-sm border border-gray-200 bg-white shadow-soft-sm transition-all hover:border-purple-500 hover:bg-violet-50 focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0";

    return (
        <GuestLayout bgColor="#f9fafb">
            <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-3xl font-semibold leading-tight tracking-tight text-gray-900 lg:text-4xl">
                            Liên hệ hợp tác
                        </h1>
                        <p className="text-base font-medium text-gray-500 lg:text-lg">
                            Bạn là trường học hoặc nhà cung cấp? Điền form bên dưới, chúng tôi sẽ liên hệ lại.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5 rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-lg lg:p-8"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">
                                Bạn là?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 1 }))}
                                    className="flex min-h-[112px] flex-col items-center justify-center rounded-[8px] border bg-white p-4 text-center shadow-soft-sm transition-colors hover:bg-gray-50"
                                    style={form.type === 1 ? { borderColor: successThemes[1].primary, backgroundColor: successThemes[1].soft } : { borderColor: "#E5E7EB" }}
                                >
                                    <School className="mb-2 h-7 w-7" strokeWidth={1.8} style={{ color: form.type === 1 ? successThemes[1].primary : "#6B7280" }} />
                                    <div className="text-sm font-semibold text-gray-900">
                                        Trường học
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 2 }))}
                                    className="flex min-h-[112px] flex-col items-center justify-center rounded-[8px] border bg-white p-4 text-center shadow-soft-sm transition-colors hover:bg-gray-50"
                                    style={form.type === 2 ? { borderColor: successThemes[2].primary, backgroundColor: successThemes[2].soft } : { borderColor: "#E5E7EB" }}
                                >
                                    <Building2 className="mb-2 h-7 w-7" strokeWidth={1.8} style={{ color: form.type === 2 ? successThemes[2].primary : "#6B7280" }} />
                                    <div className="text-sm font-semibold text-gray-900">
                                        Nhà cung cấp
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Tên tổ chức <span className="text-red-800">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.organizationName}
                                onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                                placeholder="VD: Trường THCS Nguyễn Huệ"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Họ tên người liên hệ <span className="text-red-800">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.contactPersonName}
                                onChange={e => setForm(f => ({ ...f, contactPersonName: e.target.value }))}
                                placeholder="VD: Nguyễn Văn A"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Email liên hệ <span className="text-red-800">*</span>
                            </label>
                            <input
                                type="email"
                                value={form.contactEmail}
                                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                                placeholder="email@example.com"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Số điện thoại <span className="text-red-800">*</span>
                            </label>
                            <input
                                type="tel"
                                value={form.contactPhone}
                                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                                placeholder="0901234567"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Mô tả thêm
                            </label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Thông tin thêm về trường/công ty của bạn..."
                                rows={3}
                                className="nb-input w-full resize-none border border-gray-200 bg-white text-sm shadow-soft-sm transition-all hover:border-purple-500 hover:bg-violet-50 focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-3">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="partnership-terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                    className="mt-0.5 h-5 w-5 rounded-[5px] border-[1.5px] border-gray-300 bg-white data-[state=checked]:border-purple-700 data-[state=checked]:bg-purple-700"
                                />
                                <label htmlFor="partnership-terms" className="text-sm font-semibold leading-6 text-gray-700">
                                    Tôi đã đọc và đồng ý với{" "}
                                    <button
                                        type="button"
                                        onClick={() => setIsTermsOpen(true)}
                                        className="font-extrabold text-purple-700 underline decoration-purple-300 underline-offset-2 transition-colors hover:text-purple-900"
                                    >
                                        Điều khoản sử dụng
                                    </button>
                                    .
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-purple-700 bg-[#6938EF] text-base font-semibold text-white shadow-soft-md transition-colors hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {loading ? "Đang gửi..." : "Gửi yêu cầu liên hệ"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm font-medium">
                        <span className="text-gray-600">Bạn là phụ huynh? </span>
                        <Link
                            to="/signup/parent"
                            className="font-semibold text-gray-900 transition-colors hover:text-purple-500"
                        >
                            Đăng ký tài khoản
                        </Link>
                    </p>
                </div>
            </main>
            <TermsOfUseModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </GuestLayout>
    );
};
