import { useState } from "react";
import { flushSync } from "react-dom";
import type { ContractDto } from "../../lib/api/contracts";
import { SignaturePad } from "./SignaturePad";
import { OTPVerification } from "./OTPVerification";
import { generateContractPdf } from "./pdfUtils";

// ── Extended contract data (extra fields not yet in BE — optional for now) ──
export interface ContractTemplateData extends ContractDto {
    // School — to be added in BE migration
    schoolAddress?: string;
    schoolTaxCode?: string;
    schoolRepName?: string;
    schoolRepTitle?: string;
    schoolPhone?: string;
    // Provider — partly exists (address, phone, email, contactPersonName)
    providerAddress?: string;
    providerTaxCode?: string;
    providerRepName?: string;   // = ContactPersonName
    providerRepTitle?: string;
    providerPhone?: string;
    providerEmail?: string;
    // Signatures (base64 PNG)
    schoolSignature?: string | null;
    providerSignature?: string | null;
    schoolSignedAt?: string | null;
    providerSignedAt?: string | null;
    // Masked contact for OTP (e.g. "t***@gmail.com") — from user profile
    schoolMaskedContact?: string;
    providerMaskedContact?: string;
    // Signer display name for OTP screen
    schoolSignerName?: string;
    providerSignerName?: string;
}

export interface ContractTemplateProps {
    contract: ContractTemplateData;
    /** Who is currently viewing this contract */
    viewerRole: "school" | "provider" | "readonly";
    /**
     * Called when the school user clicks "Ký" to request an OTP email.
     * If undefined → uses mock delay (demo/preview mode).
     */
    onRequestSchoolOTP?: () => Promise<void>;
    /** Called when provider user clicks "Ký" to request an OTP email. */
    onRequestProviderOTP?: () => Promise<void>;
    /**
     * Called when school confirms OTP + submits signature.
     * Receives base64 PNG signature, verified OTP code, and optional base64 PDF.
     * If undefined → visual-only demo mode.
     */
    onSchoolSign?: (signature: string, otpCode: string, pdfBase64?: string) => Promise<void>;
    /** Called when provider confirms OTP + submits signature. */
    onProviderSign?: (signature: string, otpCode: string, pdfBase64?: string) => Promise<void>;
    onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NA = "..."; // placeholder for missing data

function fmtDate(dateStr?: string | null): string {
    if (!dateStr) return NA;
    const d = new Date(dateStr);
    return `ngày ${d.getDate().toString().padStart(2, "0")} tháng ${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")} năm ${d.getFullYear()}`;
}

function fmtDateShort(dateStr?: string | null): string {
    if (!dateStr) return NA;
    return new Date(dateStr).toLocaleDateString("vi-VN");
}

function fmtCurrency(n: number): string {
    return n.toLocaleString("vi-VN") + " đồng";
}

function genContractNumber(c: ContractTemplateData): string {
    if (c.contractNumber) return c.contractNumber;
    const year = new Date(c.createdAt).getFullYear();
    const short = c.contractId.replace(/-/g, "").slice(-6).toUpperCase();
    return `HĐ-${year}-${short}`;
}

// ── PDF download helper ───────────────────────────────────────────────────────

async function downloadContractPdf(
    contractDocId: string,
    contractName: string,
    setGenerating: (v: boolean) => void
) {
    setGenerating(true);
    try {
        const base64 = await generateContractPdf(contractDocId);
        if (!base64) throw new Error("Không thể tạo PDF");

        // Decode base64 → Blob → download
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${contractName.replace(/[^\w\s-]/g, "")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("[downloadContractPdf]", err);
        alert("Không thể xuất PDF. Vui lòng thử lại.");
    } finally {
        setGenerating(false);
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractTemplate({
    contract,
    viewerRole,
    onRequestSchoolOTP,
    onRequestProviderOTP,
    onSchoolSign,
    onProviderSign,
    onClose,
}: ContractTemplateProps) {
    const contractDocId = "contract-document-print";

    // Local signature state (visual demo — works even without BE sign endpoint)
    const [localSchoolSig, setLocalSchoolSig] = useState<string | null>(
        contract.schoolSignature ?? null
    );
    const [localProviderSig, setLocalProviderSig] = useState<string | null>(
        contract.providerSignature ?? null
    );
    const [localSchoolSignedAt, setLocalSchoolSignedAt] = useState<string | null>(
        contract.schoolSignedAt ?? null
    );
    const [localProviderSignedAt, setLocalProviderSignedAt] = useState<string | null>(
        contract.providerSignedAt ?? null
    );

    // OTP step (shown before signature pad)
    const [showSchoolOTP, setShowSchoolOTP] = useState(false);
    const [showProviderOTP, setShowProviderOTP] = useState(false);

    // Store OTP code after verification to forward to sign handler
    const [pendingSchoolOTP, setPendingSchoolOTP] = useState("");
    const [pendingProviderOTP, setPendingProviderOTP] = useState("");

    const [showSchoolPad, setShowSchoolPad] = useState(false);
    const [showProviderPad, setShowProviderPad] = useState(false);
    const [signing, setSigning] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const contractNumber = genContractNumber(contract);

    // Totals
    const totalMin = contract.items.reduce(
        (s, i) => s + i.pricePerUnit * i.minQuantity,
        0
    );
    const totalMax = contract.items.reduce(
        (s, i) => s + i.pricePerUnit * i.maxQuantity,
        0
    );

    // ── Sign handlers ──

    const handleSchoolSign = async (sigData: string) => {
        setShowSchoolPad(false);
        setSigning(true);

        // 1. Update DOM immediately so signature renders before PDF capture
        flushSync(() => {
            setLocalSchoolSig(sigData);
            setLocalSchoolSignedAt(new Date().toISOString());
        });

        try {
            // 2. Let browser paint the signature, then capture PDF
            await new Promise((r) => setTimeout(r, 120));
            const pdfBase64 = await generateContractPdf(contractDocId);

            // 3. Call BE with signature + PDF
            if (onSchoolSign) {
                await onSchoolSign(sigData, pendingSchoolOTP, pdfBase64 ?? undefined);
            }

            setSuccessMsg("Bên A (Trường học) đã ký thành công!");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err: any) {
            // Revert optimistic update on BE failure
            setLocalSchoolSig(contract.schoolSignature ?? null);
            setLocalSchoolSignedAt(contract.schoolSignedAt ?? null);
            const msg = err?.message || "Ký thất bại. Vui lòng thử lại.";
            setSuccessMsg(`❌ ${msg}`);
            setTimeout(() => setSuccessMsg(""), 5000);
        } finally {
            setPendingSchoolOTP("");
            setSigning(false);
        }
    };

    const handleProviderSign = async (sigData: string) => {
        setShowProviderPad(false);
        setSigning(true);

        // 1. Update DOM immediately so signature renders before PDF capture
        flushSync(() => {
            setLocalProviderSig(sigData);
            setLocalProviderSignedAt(new Date().toISOString());
        });

        try {
            // 2. Let browser paint, then capture PDF
            await new Promise((r) => setTimeout(r, 120));
            const pdfBase64 = await generateContractPdf(contractDocId);

            // 3. Call BE with signature + PDF
            if (onProviderSign) {
                await onProviderSign(sigData, pendingProviderOTP, pdfBase64 ?? undefined);
            }

            setSuccessMsg("Bên B (Nhà cung cấp) đã ký thành công!");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err: any) {
            // Revert on failure
            setLocalProviderSig(contract.providerSignature ?? null);
            setLocalProviderSignedAt(contract.providerSignedAt ?? null);
            const msg = err?.message || "Ký thất bại. Vui lòng thử lại.";
            setSuccessMsg(`❌ ${msg}`);
            setTimeout(() => setSuccessMsg(""), 5000);
        } finally {
            setPendingProviderOTP("");
            setSigning(false);
        }
    };

    const bothSigned = !!localSchoolSig && !!localProviderSig;

    // ── Sign button logic — School can sign at Pending or PendingSchoolSign ──
    const canSchoolSign = viewerRole === "school" && (contract.status === "Pending" || contract.status === "PendingSchoolSign") && !localSchoolSig;
    const canProviderSign = viewerRole === "provider" && contract.status === "PendingProviderSign" && !localProviderSig;

    return (
        <>
            {/* ── Full-screen overlay ── */}
            <div className="fixed inset-0 z-[100] flex flex-col bg-[#1A1A2E]/80">

                {/* Toolbar */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b-2 border-[#1A1A2E]">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">📄</span>
                        <div className="min-w-0">
                            <p className="font-extrabold text-[#1A1A2E] text-sm truncate">{contract.contractName}</p>
                            <p className="text-xs text-[#6B7280]">Số: {contractNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {successMsg && (
                            <span className={`text-xs font-bold px-3 py-1 rounded border ${successMsg.startsWith("❌")
                                ? "text-[#991B1B] bg-[#FEE2E2] border-[#FECACA]"
                                : "text-[#059669] bg-[#D1FAE5] border-[#059669]"
                                }`}>
                                {successMsg}
                            </span>
                        )}

                        {/* Sign button (School) — opens OTP first */}
                        {canSchoolSign && (
                            <button
                                onClick={() => setShowSchoolOTP(true)}
                                disabled={signing}
                                className="nb-btn nb-btn-purple nb-btn-sm text-xs disabled:opacity-50"
                            >
                                {signing ? "⏳ Đang xử lý..." : "✍️ Ký"}
                            </button>
                        )}

                        {/* Sign button (Provider) — opens OTP first */}
                        {canProviderSign && (
                            <button
                                onClick={() => setShowProviderOTP(true)}
                                disabled={signing}
                                className="nb-btn nb-btn-purple nb-btn-sm text-xs disabled:opacity-50"
                            >
                                {signing ? "⏳ Đang xử lý..." : "✍️ Ký"}
                            </button>
                        )}

                        {bothSigned && (
                            <span className="text-xs font-bold text-[#059669] bg-[#D1FAE5] border border-[#059669] px-3 py-1 rounded">
                                ✅ Hai bên đã ký
                            </span>
                        )}

                        {/* Download saved PDF (if generated after signing) */}
                        {contract.contractPdfUrl && (
                            <a
                                href={`${import.meta.env.VITE_API_BASE_URL}${contract.contractPdfUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nb-btn nb-btn-sm text-xs bg-[#D1FAE5] border-[#1A1A2E]"
                            >
                                📥 Tải PDF
                            </a>
                        )}

                        {/* Export PDF */}
                        <button
                            onClick={() => downloadContractPdf(contractDocId, contract.contractName, setGeneratingPdf)}
                            disabled={generatingPdf}
                            className="nb-btn nb-btn-outline nb-btn-sm text-xs disabled:opacity-50"
                        >
                            {generatingPdf ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
                                    Đang xuất...
                                </span>
                            ) : "🖨️ In / PDF"}
                        </button>

                        <button
                            onClick={onClose}
                            className="nb-btn nb-btn-sm text-xs bg-[#FEE2E2] border-[#1A1A2E]"
                        >
                            ✕ Đóng
                        </button>
                    </div>
                </div>

                {/* Scrollable contract area */}
                <div className="flex-1 overflow-y-auto py-8 px-4">
                    <div
                        id={contractDocId}
                        style={{
                            maxWidth: "794px", // A4 width at 96dpi
                            margin: "0 auto",
                            background: "#fff",
                            border: "1px solid #D1D5DB",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                            padding: "48px 56px",
                            fontFamily: "'Times New Roman', Times, serif",
                            fontSize: "14px",
                            lineHeight: "1.8",
                            color: "#1A1A2E",
                        }}
                    >
                        {/* ── Header ── */}
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <p style={{ fontWeight: "bold", fontSize: "13px", letterSpacing: "0.05em" }}>
                                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                            </p>
                            <p style={{ fontWeight: "bold", fontSize: "13px" }}>
                                Độc lập - Tự do - Hạnh phúc
                            </p>
                            <p style={{ textAlign: "center", margin: "4px 0 20px", color: "#6B7280" }}>
                                ───────────────────
                            </p>
                            <p style={{ fontWeight: "bold", fontSize: "17px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Hợp đồng cung ứng đồng phục
                            </p>
                            <p style={{ fontSize: "13px", marginTop: "4px", color: "#374151" }}>
                                Số: <strong>{contractNumber}</strong>
                            </p>
                        </div>

                        {/* ── Date ── */}
                        <p style={{ marginBottom: "24px", fontStyle: "italic" }}>
                            Hôm nay, {fmtDate(contract.createdAt)}, chúng tôi gồm:
                        </p>

                        {/* ── Party A ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                BÊN A (BÊN ĐẶT HÀNG — TRƯỜNG HỌC):
                            </p>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                    {[
                                        ["Tên trường:", contract.schoolName],
                                        ["Địa chỉ:", contract.schoolAddress],
                                        ["Mã số thuế:", contract.schoolTaxCode],
                                        ["Đại diện:", contract.schoolRepName],
                                        ["Chức vụ:", contract.schoolRepTitle],
                                        ["Điện thoại:", contract.schoolPhone],
                                    ].filter(([, value]) => value != null && value !== "")
                                        .map(([label, value]) => (
                                            <tr key={label}>
                                                <td style={{ paddingLeft: "20px", paddingRight: "8px", width: "160px", verticalAlign: "top", color: "#4B5563" }}>
                                                    {label}
                                                </td>
                                                <td style={{ fontWeight: "600", color: "#1A1A2E" }}>
                                                    {value}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Party B ── */}
                        <div style={{ marginBottom: "28px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                BÊN B (BÊN CUNG ỨNG — NHÀ CUNG CẤP):
                            </p>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                    {[
                                        ["Tên công ty:", contract.providerName],
                                        ["Địa chỉ:", contract.providerAddress],
                                        ["Mã số thuế:", contract.providerTaxCode],
                                        ["Đại diện:", contract.providerRepName],
                                        ["Chức vụ:", contract.providerRepTitle],
                                        ["Điện thoại:", contract.providerPhone],
                                        ["Email:", contract.providerEmail],
                                    ].filter(([, value]) => value != null && value !== "")
                                        .map(([label, value]) => (
                                            <tr key={label}>
                                                <td style={{ paddingLeft: "20px", paddingRight: "8px", width: "160px", verticalAlign: "top", color: "#4B5563" }}>
                                                    {label}
                                                </td>
                                                <td style={{ fontWeight: "600", color: "#1A1A2E" }}>
                                                    {value}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <p style={{ marginBottom: "24px" }}>
                            Hai bên thống nhất ký kết hợp đồng cung ứng đồng phục học sinh với các điều khoản và điều kiện dưới đây:
                        </p>

                        <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "20px 0" }} />

                        {/* ── Article 1 ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Điều 1. ĐỐI TƯỢNG VÀ PHẠM VI HỢP ĐỒNG
                            </p>
                            <p style={{ paddingLeft: "20px" }}>
                                Bên B cung cấp cho Bên A các sản phẩm đồng phục học sinh theo danh mục, số lượng và điều kiện quy định tại Điều 2 của hợp đồng này. Sản phẩm phục vụ nhu cầu mặc đồng phục của học sinh tại{" "}
                                <strong>{contract.schoolName ?? "trường"}</strong>, theo từng đợt đặt hàng do Bên A khởi tạo trên nền tảng VTOS.
                            </p>
                        </div>

                        {/* ── Article 2 — Products table ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "12px" }}>
                                Điều 2. DANH MỤC SẢN PHẨM VÀ GIÁ CẢ THỎA THUẬN
                            </p>
                            <table style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "13px",
                                marginBottom: "12px",
                            }}>
                                <thead>
                                    <tr style={{ background: "#F3F4F6" }}>
                                        {["STT", "Tên sản phẩm", "Đơn giá (₫)", "SL tối thiểu", "SL tối đa", "Thành tiền tối thiểu"].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    border: "1px solid #D1D5DB",
                                                    padding: "8px 10px",
                                                    textAlign: "center",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {contract.items.map((item, idx) => (
                                        <tr key={item.itemId} style={{ background: idx % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", textAlign: "center" }}>{idx + 1}</td>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", fontWeight: "600" }}>{item.outfitName}</td>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", textAlign: "right" }}>
                                                {item.pricePerUnit.toLocaleString("vi-VN")}
                                            </td>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", textAlign: "center" }}>{item.minQuantity}</td>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", textAlign: "center" }}>{item.maxQuantity}</td>
                                            <td style={{ border: "1px solid #D1D5DB", padding: "7px 10px", textAlign: "right" }}>
                                                {(item.pricePerUnit * item.minQuantity).toLocaleString("vi-VN")}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: "#EDE9FE", fontWeight: "bold" }}>
                                        <td colSpan={5} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right" }}>
                                            Tổng giá trị ước tính (tối thiểu — tối đa):
                                        </td>
                                        <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right" }}>
                                            {fmtCurrency(totalMin)} — {fmtCurrency(totalMax)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style={{ paddingLeft: "20px", fontStyle: "italic", fontSize: "12px", color: "#6B7280" }}>
                                * Giá trị thực tế phụ thuộc vào số lượng đặt hàng từng đợt trong giới hạn quy định.
                            </p>
                        </div>

                        {/* ── Article 3 ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Điều 3. PHƯƠNG THỨC THANH TOÁN
                            </p>
                            <p style={{ paddingLeft: "20px" }}>
                                Thanh toán thực hiện thông qua hệ thống VTOS theo từng đơn đặt hàng. Bên A sử dụng ví điện tử trên nền tảng để thanh toán khi xác nhận đơn hàng. Chi tiết từng giao dịch được ghi nhận tự động trên hệ thống và có thể tra cứu bất kỳ lúc nào.
                            </p>
                        </div>

                        {/* ── Article 4 ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Điều 4. THỜI HẠN HỢP ĐỒNG
                            </p>
                            <p style={{ paddingLeft: "20px" }}>
                                Hợp đồng có hiệu lực kể từ ngày cả hai bên hoàn tất ký kết và hết hiệu lực vào{" "}
                                <strong>{fmtDate(contract.expiresAt)}</strong> ({fmtDateShort(contract.expiresAt)}).
                                Trong thời hạn hiệu lực, Bên A có thể tạo nhiều đợt đặt hàng dựa trên các điều khoản đã thỏa thuận. Hợp đồng hết hạn mà chưa được gia hạn sẽ tự động chuyển sang trạng thái "Hết hạn".
                            </p>
                        </div>

                        {/* ── Article 5 ── */}
                        <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Điều 5. QUYỀN VÀ NGHĨA VỤ CÁC BÊN
                            </p>
                            <p style={{ paddingLeft: "20px", fontWeight: "600", marginBottom: "4px" }}>5.1. Bên A có trách nhiệm:</p>
                            <ul style={{ paddingLeft: "40px", marginBottom: "10px" }}>
                                <li>Đặt hàng trong giới hạn số lượng đã thỏa thuận tại Điều 2;</li>
                                <li>Thanh toán đúng hạn theo từng đơn hàng trên hệ thống;</li>
                                <li>Tiếp nhận, kiểm tra và xác nhận hàng hóa khi nhận giao;</li>
                                <li>Thông báo kịp thời nếu phát sinh vấn đề về chất lượng sản phẩm.</li>
                            </ul>
                            <p style={{ paddingLeft: "20px", fontWeight: "600", marginBottom: "4px" }}>5.2. Bên B có trách nhiệm:</p>
                            <ul style={{ paddingLeft: "40px" }}>
                                <li>Cung cấp sản phẩm đúng quy cách, chất lượng như đã đăng ký trên hệ thống;</li>
                                <li>Giao hàng đúng thời hạn theo lịch sản xuất từng đơn hàng;</li>
                                <li>Đảm bảo chính sách đổi trả hợp lý khi sản phẩm lỗi do nhà sản xuất;</li>
                                <li>Cập nhật trạng thái sản xuất và giao hàng trên nền tảng VTOS.</li>
                            </ul>
                        </div>

                        {/* ── Article 6 ── */}
                        <div style={{ marginBottom: "28px" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Điều 6. ĐIỀU KHOẢN CHUNG
                            </p>
                            <ul style={{ paddingLeft: "40px" }}>
                                <li>Hợp đồng được ký kết điện tử thông qua nền tảng VTOS và có giá trị pháp lý tương đương hợp đồng ký tay theo quy định pháp luật hiện hành;</li>
                                <li>Mọi thay đổi điều khoản phải được sự đồng ý bằng văn bản của cả hai bên;</li>
                                <li>Tranh chấp phát sinh ưu tiên giải quyết thông qua thương lượng. Nếu không đạt được thỏa thuận trong 30 ngày, tranh chấp sẽ được đưa ra cơ quan tài phán có thẩm quyền;</li>
                                <li>Hợp đồng này được lập thành 01 bản điện tử lưu trên hệ thống, có giá trị pháp lý ngang nhau cho cả hai bên.</li>
                            </ul>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "24px 0" }} />

                        {/* ── Signatures ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "32px", marginTop: "12px" }}>

                            {/* School signature */}
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>ĐẠI DIỆN BÊN A</p>
                                <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>
                                    (Ký, ghi rõ họ tên)
                                </p>
                                <div style={{
                                    border: "1px dashed #9CA3AF",
                                    borderRadius: "4px",
                                    height: "100px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: localSchoolSig ? "transparent" : "#F9FAFB",
                                    marginBottom: "8px",
                                    overflow: "hidden",
                                    position: "relative",
                                }}>
                                    {localSchoolSig ? (
                                        <img
                                            src={localSchoolSig}
                                            alt="Chữ ký Bên A"
                                            style={{ maxHeight: "90px", maxWidth: "100%", objectFit: "contain" }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Chưa ký</span>
                                    )}
                                </div>
                                <p style={{ fontWeight: "600", fontSize: "13px" }}>
                                    {contract.schoolRepName ?? contract.schoolName ?? NA}
                                </p>
                                {localSchoolSignedAt && (
                                    <p style={{ fontSize: "11px", color: "#059669" }}>
                                        ✓ Đã ký: {fmtDateShort(localSchoolSignedAt)}
                                    </p>
                                )}
                            </div>

                            {/* Provider signature */}
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>ĐẠI DIỆN BÊN B</p>
                                <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>
                                    (Ký, ghi rõ họ tên)
                                </p>
                                <div style={{
                                    border: "1px dashed #9CA3AF",
                                    borderRadius: "4px",
                                    height: "100px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: localProviderSig ? "transparent" : "#F9FAFB",
                                    marginBottom: "8px",
                                    overflow: "hidden",
                                }}>
                                    {localProviderSig ? (
                                        <img
                                            src={localProviderSig}
                                            alt="Chữ ký Bên B"
                                            style={{ maxHeight: "90px", maxWidth: "100%", objectFit: "contain" }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Chưa ký</span>
                                    )}
                                </div>
                                <p style={{ fontWeight: "600", fontSize: "13px" }}>
                                    {contract.providerRepName ?? contract.providerName ?? NA}
                                </p>
                                {localProviderSignedAt && (
                                    <p style={{ fontSize: "11px", color: "#059669" }}>
                                        ✓ Đã ký: {fmtDateShort(localProviderSignedAt)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Audit trail (shown once at least one party has signed) ── */}
                        {(localSchoolSignedAt || localProviderSignedAt) && (
                            <div style={{
                                marginTop: "28px",
                                background: "#F0FDF4",
                                border: "1px solid #BBF7D0",
                                borderRadius: "6px",
                                padding: "14px 18px",
                                fontSize: "12px",
                            }}>
                                <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#065F46", fontSize: "12px" }}>
                                    📋 THÔNG TIN XÁC THỰC CHỮ KÝ ĐIỆN TỬ
                                </p>
                                {localSchoolSignedAt && (
                                    <p style={{ marginBottom: "4px", color: "#374151" }}>
                                        <strong>Bên A:</strong>{" "}
                                        {contract.schoolSignerName ?? contract.schoolRepName ?? contract.schoolName ?? "—"}
                                        {" "}• Ký lúc{" "}
                                        {new Date(localSchoolSignedAt).toLocaleString("vi-VN")}
                                    </p>
                                )}
                                {localProviderSignedAt && (
                                    <p style={{ marginBottom: "4px", color: "#374151" }}>
                                        <strong>Bên B:</strong>{" "}
                                        {contract.providerSignerName ?? contract.providerRepName ?? contract.providerName ?? "—"}
                                        {" "}• Ký lúc{" "}
                                        {new Date(localProviderSignedAt).toLocaleString("vi-VN")}
                                    </p>
                                )}
                                <p style={{ marginTop: "8px", color: "#6B7280", fontSize: "11px" }}>
                                    Mã hợp đồng: <strong>VTOS-{contractNumber}</strong>
                                    {" "}• Ref:{" "}
                                    <span style={{ fontFamily: "monospace" }}>
                                        {contract.contractId.slice(-12).toUpperCase()}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Footer note */}
                        <p style={{
                            marginTop: "24px",
                            fontSize: "11px",
                            color: "#9CA3AF",
                            textAlign: "center",
                            borderTop: "1px solid #F3F4F6",
                            paddingTop: "12px",
                        }}>
                            Hợp đồng được tạo tự động và lưu trữ trên nền tảng VTOS • {fmtDateShort(contract.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Step 1: OTP Verification ── */}
            {showSchoolOTP && (
                <OTPVerification
                    signerName={contract.schoolSignerName ?? contract.schoolRepName ?? contract.schoolName ?? undefined}
                    maskedContact={contract.viewerMaskedContact ?? contract.schoolMaskedContact ?? "email / SĐT đã đăng ký"}
                    onRequestOTP={onRequestSchoolOTP}
                    onVerified={(code) => { setPendingSchoolOTP(code); setShowSchoolOTP(false); setShowSchoolPad(true); }}
                    onCancel={() => setShowSchoolOTP(false)}
                />
            )}
            {showProviderOTP && (
                <OTPVerification
                    signerName={contract.providerSignerName ?? contract.providerRepName ?? contract.providerName ?? undefined}
                    maskedContact={contract.viewerMaskedContact ?? contract.providerMaskedContact ?? "email / SĐT đã đăng ký"}
                    onRequestOTP={onRequestProviderOTP}
                    onVerified={(code) => { setPendingProviderOTP(code); setShowProviderOTP(false); setShowProviderPad(true); }}
                    onCancel={() => setShowProviderOTP(false)}
                />
            )}

            {/* ── Step 2: Signature Pad (draw or upload PNG) ── */}
            {showSchoolPad && (
                <SignaturePad
                    title="Ký tên — Đại diện Bên A (Trường học)"
                    onSave={handleSchoolSign}
                    onCancel={() => setShowSchoolPad(false)}
                />
            )}
            {showProviderPad && (
                <SignaturePad
                    title="Ký tên — Đại diện Bên B (Nhà cung cấp)"
                    onSave={handleProviderSign}
                    onCancel={() => setShowProviderPad(false)}
                />
            )}
        </>
    );
}
