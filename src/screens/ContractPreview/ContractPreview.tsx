/**
 * PREVIEW-ONLY page — shows ContractTemplate with mock data.
 * Route: /contract-preview  (no auth required)
 * Remove this page after BE is connected.
 */
import { useState } from "react";
import { ContractTemplate, type ContractTemplateData } from "../../components/ContractTemplate";

const MOCK_CONTRACT: ContractTemplateData = {
    contractId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    schoolId: "school-001",
    providerId: "provider-001",
    contractName: "Hợp đồng đồng phục Học kỳ 1 – Năm học 2025–2026",
    status: "Pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // +6 months
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,

    // Party A — School
    schoolName: "Trường Tiểu học Lê Văn Tám",
    schoolAddress: "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
    schoolTaxCode: "0312345678",
    schoolRepName: "Nguyễn Thị Hương",
    schoolRepTitle: "Hiệu trưởng",
    schoolPhone: "028 3456 7890",

    // Party B — Provider
    providerName: "Công ty TNHH May Mặc Đồng Phục Phương Nam",
    providerAddress: "456 Lê Đại Hành, Quận 11, TP. Hồ Chí Minh",
    providerTaxCode: "0398765432",
    providerRepName: "Trần Văn Minh",
    providerRepTitle: "Giám đốc",
    providerPhone: "028 9876 5432",
    providerEmail: "phuongnam@dongphuc.vn",

    // Contract items
    items: [
        {
            itemId: "item-001",
            outfitId: "outfit-001",
            outfitName: "Đồng phục mùa hè (áo trắng + quần xanh)",
        },
        {
            itemId: "item-002",
            outfitId: "outfit-002",
            outfitName: "Đồng phục thể dục (áo thun + quần short)",
        },
        {
            itemId: "item-003",
            outfitId: "outfit-003",
            outfitName: "Áo khoác đồng phục mùa đông",
        },
    ],

    contractNumber: "HĐ-2025-001",
    schoolSignature: null,
    providerSignature: null,
    schoolSignedAt: null,
    providerSignedAt: null,
    // OTP demo info
    schoolMaskedContact: "h***g@truong.edu.vn",
    providerMaskedContact: "m***h@phuongnam.vn",
    schoolSignerName: "Nguyễn Thị Hương",
    providerSignerName: "Trần Văn Minh",
};

type ViewerRole = "school" | "provider" | "readonly";

export function ContractPreview() {
    const [role, setRole] = useState<ViewerRole>("school");
    const [open, setOpen] = useState(false);

    return (
        <div className="nb-page min-h-screen flex items-center justify-center p-8">
            <div className="nb-card-static p-8 w-full max-w-lg text-center space-y-6">
                <div>
                    <p className="text-3xl mb-2">📄</p>
                    <h1 className="font-extrabold text-gray-900 text-2xl">Contract Template Preview</h1>
                    <p className="text-sm text-gray-500 mt-1">Trang demo — không cần đăng nhập</p>
                </div>

                {/* Role selector */}
                <div>
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Xem với vai trò</p>
                    <div className="flex gap-3 justify-center">
                        {(["school", "provider", "readonly"] as ViewerRole[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={`nb-btn nb-btn-sm text-xs ${role === r ? "nb-btn-purple" : "nb-btn-outline"}`}
                            >
                                {r === "school" ? "🏫 Trường" : r === "provider" ? "🏭 NCC" : "👁 Chỉ xem"}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {role === "school" && "→ Hiện nút Ký (Bên A)"}
                        {role === "provider" && "→ Hiện nút Ký (Bên B)"}
                        {role === "readonly" && "→ Chỉ xem, không ký"}
                    </p>
                </div>

                <button
                    onClick={() => setOpen(true)}
                    className="nb-btn nb-btn-purple w-full text-base py-3"
                >
                    📋 Mở Contract Template
                </button>

                <p className="text-xs text-gray-400">
                    Dùng nút <strong>✍️ Ký</strong> để thử ký tên &nbsp;·&nbsp;
                    Dùng nút <strong>🖨️ In / PDF</strong> để xuất PDF
                </p>
            </div>

            {open && (
                <ContractTemplate
                    contract={MOCK_CONTRACT}
                    viewerRole={role}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}
