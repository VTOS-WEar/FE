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
            <GuestLayout bgColor="#f4f2ff">
                <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-20">
                    <div className="mx-auto w-full max-w-lg text-center">
                        <div className="bg-white rounded-2xl shadow-lg p-10">
                            <div className="text-6xl mb-5">✅</div>
                            <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-2xl lg:text-3xl mb-3">
                                Yêu cầu đã được gửi!
                            </h1>
                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base mb-6">
                                Cảm ơn bạn đã quan tâm đến VTOS. Đội ngũ chăm sóc sẽ liên hệ với bạn trong thời gian sớm nhất.
                            </p>
                            <Link
                                to="/homepage"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6938ef] to-[#9b6dff] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
                            >
                                ← Về trang chủ
                            </Link>
                        </div>
                    </div>
                </main>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout bgColor="#f4f2ff">
            <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-20">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl mb-3">
                            Liên hệ hợp tác
                        </h1>
                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base lg:text-lg">
                            Bạn là trường học hoặc nhà cung cấp? Điền form bên dưới, chúng tôi sẽ liên hệ lại.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 space-y-5"
                    >
                        {/* Type selector */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-2 [font-family:'Montserrat',Helvetica]">
                                Bạn là?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 1 }))}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                                        form.type === 1
                                            ? "border-[#0ea5e9] bg-[#f0f9ff] shadow-sm"
                                            : "border-[#e5e3f0] hover:border-[#0ea5e9]/50"
                                    }`}
                                >
                                    <div className="text-3xl mb-1">🏫</div>
                                    <div className="font-semibold text-sm [font-family:'Montserrat',Helvetica]">
                                        Trường học
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 2 }))}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                                        form.type === 2
                                            ? "border-[#f59e0b] bg-[#fffbeb] shadow-sm"
                                            : "border-[#e5e3f0] hover:border-[#f59e0b]/50"
                                    }`}
                                >
                                    <div className="text-3xl mb-1">🏭</div>
                                    <div className="font-semibold text-sm [font-family:'Montserrat',Helvetica]">
                                        Nhà cung cấp
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Organization name */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Tên tổ chức <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.organizationName}
                                onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                                placeholder="VD: Trường THCS Nguyễn Huệ"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm"
                            />
                        </div>

                        {/* Contact person name */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Họ tên người liên hệ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.contactPersonName}
                                onChange={e => setForm(f => ({ ...f, contactPersonName: e.target.value }))}
                                placeholder="VD: Nguyễn Văn A"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Email liên hệ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={form.contactEmail}
                                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={form.contactPhone}
                                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                                placeholder="0901234567"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-[#100f14] mb-1 [font-family:'Montserrat',Helvetica]">
                                Mô tả thêm
                            </label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Thông tin thêm về trường/công ty của bạn..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e3f0] bg-[#fafafa] focus:outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors [font-family:'Montserrat',Helvetica] text-sm resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm [font-family:'Montserrat',Helvetica]">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#6938ef] to-[#9b6dff] text-white py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 [font-family:'Montserrat',Helvetica]"
                        >
                            {loading ? "Đang gửi..." : "Gửi yêu cầu liên hệ"}
                        </button>
                    </form>

                    <p className="text-center mt-6 [font-family:'Poppins',Helvetica] font-normal text-sm">
                        <span className="text-[#494759]">Bạn là phụ huynh? </span>
                        <Link
                            to="/signup/parent"
                            className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] hover:underline"
                        >
                            Đăng ký tài khoản
                        </Link>
                    </p>
                </div>
            </main>
        </GuestLayout>
    );
};
