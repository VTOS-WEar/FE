import { useState } from "react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { Link } from "react-router-dom";
import { submitAccountRequest } from "../../lib/api/accountRequests";

export const ContactPartnership = (): JSX.Element => {
    const [form, setForm] = useState({
        organizationName: "",
        contactPersonName: "",
        contactEmail: "",
        contactPhone: "",
        type: 1 as 1 | 2,
        description: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.organizationName.trim()) return setError("Vui lòng nhập tên tổ chức");
        if (!form.contactPersonName.trim()) return setError("Vui lòng nhập họ tên người liên hệ");
        if (!form.contactEmail.trim()) return setError("Vui lòng nhập email liên hệ");
        if (!form.contactPhone.trim()) return setError("Vui lòng nhập số điện thoại");

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
            <GuestLayout bgColor="#FFF8F0">
                <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
                    <div className="mx-auto w-full max-w-lg text-center">
                        <div className="nb-card-static p-10">
                            <div className="text-6xl mb-5">✅</div>
                            <h1 className="font-extrabold text-[#1A1A2E] text-2xl lg:text-3xl mb-3">
                                Yêu cầu đã được gửi! ✦
                            </h1>
                            <p className="font-medium text-[#6B7280] text-base mb-6">
                                Cảm ơn bạn đã quan tâm đến VTOS. Đội ngũ chăm sóc sẽ liên hệ với bạn trong thời gian sớm nhất.
                            </p>
                            <Link
                                to="/homepage"
                                className="nb-btn nb-btn-purple text-base"
                            >
                                ← Về trang chủ
                            </Link>
                        </div>
                    </div>
                </main>
            </GuestLayout>
        );
    }

    const inputClass = "nb-input w-full h-11 text-sm";

    return (
        <GuestLayout bgColor="#FFF8F0">
            <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <h1 className="font-extrabold text-[#1A1A2E] text-3xl lg:text-4xl mb-3">
                            Liên hệ hợp tác ✦
                        </h1>
                        <p className="font-bold text-[#6B7280] text-base lg:text-lg">
                            Bạn là trường học hoặc nhà cung cấp? Điền form bên dưới, chúng tôi sẽ liên hệ lại.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="nb-card-static p-6 lg:p-8 space-y-5"
                    >
                        {/* Type selector */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-2">
                                Bạn là?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 1 }))}
                                    className={`nb-card p-4 text-center ${
                                        form.type === 1
                                            ? "nb-card-blue !border-[#A8D4E6] !shadow-[4px_4px_0_#1A1A2E]"
                                            : ""
                                    }`}
                                >
                                    <div className="text-3xl mb-1">🏫</div>
                                    <div className="font-bold text-sm text-[#1A1A2E]">
                                        Trường học
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 2 }))}
                                    className={`nb-card p-4 text-center ${
                                        form.type === 2
                                            ? "nb-card-yellow !border-[#F5E642] !shadow-[4px_4px_0_#1A1A2E]"
                                            : ""
                                    }`}
                                >
                                    <div className="text-3xl mb-1">🏭</div>
                                    <div className="font-bold text-sm text-[#1A1A2E]">
                                        Nhà cung cấp
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Organization name */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
                                Tên tổ chức <span className="text-[#991B1B]">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.organizationName}
                                onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                                placeholder="VD: Trường THCS Nguyễn Huệ"
                                className={inputClass}
                            />
                        </div>

                        {/* Contact person name */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
                                Họ tên người liên hệ <span className="text-[#991B1B]">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.contactPersonName}
                                onChange={e => setForm(f => ({ ...f, contactPersonName: e.target.value }))}
                                placeholder="VD: Nguyễn Văn A"
                                className={inputClass}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
                                Email liên hệ <span className="text-[#991B1B]">*</span>
                            </label>
                            <input
                                type="email"
                                value={form.contactEmail}
                                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                                placeholder="email@example.com"
                                className={inputClass}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
                                Số điện thoại <span className="text-[#991B1B]">*</span>
                            </label>
                            <input
                                type="tel"
                                value={form.contactPhone}
                                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                                placeholder="0901234567"
                                className={inputClass}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
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

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">
                                Mô tả thêm
                            </label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Thông tin thêm về trường/công ty của bạn..."
                                rows={3}
                                className="nb-input w-full text-sm resize-none"
                            />
                        </div>

                        {error && (
                            <div className="nb-alert nb-alert-error text-sm">
                                <span>⚠</span>
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="nb-btn nb-btn-purple w-full h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Đang gửi..." : "Gửi yêu cầu liên hệ ✦"}
                        </button>
                    </form>

                    <p className="text-center mt-6 font-medium text-sm">
                        <span className="text-[#4C5769]">Bạn là phụ huynh? </span>
                        <Link
                            to="/signup/parent"
                            className="font-bold text-[#1A1A2E] hover:text-[#B8A9E8] border-b-2 border-[#B8A9E8] transition-colors"
                        >
                            Đăng ký tài khoản
                        </Link>
                    </p>
                </div>
            </main>
        </GuestLayout>
    );
};
