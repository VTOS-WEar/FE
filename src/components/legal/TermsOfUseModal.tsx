import { X } from "lucide-react";

export const VTOS_TERMS_VERSION = "2026-05-03";

type TermsOfUseModalProps = {
  open: boolean;
  onClose: () => void;
};

const termsSections = [
  {
    title: "1. Tài khoản và thông tin cung cấp",
    content:
      "Người dùng cần cung cấp thông tin chính xác, tự bảo mật tài khoản và chịu trách nhiệm với các thao tác phát sinh từ tài khoản của mình trên VTOS.",
  },
  {
    title: "2. Hành vi bị cấm",
    content:
      "Không được giả mạo danh tính, đăng tải nội dung hoặc hình ảnh trái phép, quấy rối người khác, can thiệp hoặc phá hoại hệ thống, gian lận đơn hàng/thanh toán, hoặc xâm phạm quyền riêng tư của cá nhân, trường học, nhà cung cấp.",
  },
  {
    title: "3. Sử dụng ảnh cá nhân cho thử đồ AI",
    content:
      "Khi tải ảnh cá nhân hoặc ảnh học sinh lên hệ thống, người dùng đồng ý để VTOS xử lý ảnh đó nhằm phục vụ thử đồ AI, đo hoặc ước lượng kích cỡ, lưu lịch sử thử đồ và cải thiện trải nghiệm trong phạm vi dịch vụ.",
  },
  {
    title: "4. Quyền sử dụng hình ảnh",
    content:
      "Người tải ảnh cam kết có quyền sử dụng hợp pháp đối với hình ảnh đã cung cấp. Phụ huynh hoặc người giám hộ chịu trách nhiệm khi tải ảnh trẻ em, học sinh hoặc người phụ thuộc lên hệ thống.",
  },
  {
    title: "5. Chính sách đổi trả",
    content:
      "VTOS tiếp nhận yêu cầu đổi trả khi sản phẩm lỗi, sai mẫu, sai kích cỡ do nhà cung cấp hoặc sai khác so với thông tin đã công bố. Chính sách không áp dụng cho sản phẩm đã sử dụng sai hướng dẫn, hư hỏng do người dùng, hoặc yêu cầu nằm ngoài thời hạn/chính sách áp dụng cho từng đơn hàng.",
  },
  {
    title: "6. Hoàn tiền và khiếu nại",
    content:
      "Các yêu cầu hoàn tiền hoặc khiếu nại được xử lý thông qua thông tin đơn hàng, ví/thanh toán hoặc ticket hỗ trợ. Kết quả xử lý phụ thuộc vào kiểm tra bằng chứng, trạng thái giao dịch và chính sách của từng trường hợp.",
  },
  {
    title: "7. Bảo vệ dữ liệu cá nhân",
    content:
      "VTOS chỉ sử dụng dữ liệu trong phạm vi vận hành dịch vụ, hỗ trợ người dùng, bảo mật hệ thống và cải thiện trải nghiệm. Người dùng có thể gửi yêu cầu hỗ trợ, chỉnh sửa hoặc xóa dữ liệu khi phù hợp với quy định và trạng thái giao dịch liên quan.",
  },
  {
    title: "8. Xử lý vi phạm",
    content:
      "VTOS có quyền tạm khóa, giới hạn hoặc từ chối cung cấp dịch vụ nếu tài khoản vi phạm điều khoản sử dụng, gây rủi ro cho người dùng khác hoặc ảnh hưởng đến an toàn vận hành hệ thống.",
  },
];

export function TermsOfUseModal({ open, onClose }: TermsOfUseModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-of-use-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-lg">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="terms-of-use-title" className="text-xl font-extrabold text-gray-900">
              Điều khoản sử dụng VTOS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-gray-600 shadow-soft-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            aria-label="Đóng điều khoản sử dụng"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-4 text-sm font-medium leading-6 text-gray-600">
            Nội dung dưới đây tóm tắt các điều kiện chính khi tạo tài khoản, gửi yêu cầu hợp tác,
            sử dụng ảnh để thử đồ AI, đặt hàng, đổi trả và liên hệ hỗ trợ trên VTOS.
          </p>

          <div className="space-y-3">
            {termsSections.map((section) => (
              <section key={section.title} className="rounded-[8px] border border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-extrabold text-gray-900">{section.title}</h3>
                <p className="mt-1.5 text-sm font-medium leading-6 text-gray-600">{section.content}</p>
              </section>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium leading-5 text-gray-500">
            Nội dung này là bản điều khoản vận hành của sản phẩm và có thể được cập nhật theo yêu cầu
            pháp lý, bảo mật hoặc chính sách dịch vụ.
          </p>
        </div>

        <div className="border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-purple-700 bg-[#6938EF] px-5 text-sm font-extrabold text-white shadow-soft-sm transition-colors hover:bg-[#5B21B6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
