import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";

const legalItems = [
  {
    title: "Thông tin đơn vị vận hành",
    body: "VTOS là nền tảng hỗ trợ thử đồng phục trực tuyến bằng AI, phục vụ phụ huynh, học sinh, trường học và nhà cung cấp đồng phục.",
  },
  {
    title: "Quyền sở hữu nội dung",
    body: "Toàn bộ nội dung, giao diện, nhãn hiệu và tài nguyên số trên nền tảng thuộc quyền sở hữu của VTOS hoặc các bên cấp phép hợp pháp.",
  },
  {
    title: "Giới hạn trách nhiệm",
    body: "VTOS nỗ lực đảm bảo tính chính xác của dịch vụ nhưng không cam kết tuyệt đối về mọi kết quả hiển thị trong mọi điều kiện thiết bị và dữ liệu đầu vào.",
  },
  {
    title: "Liên hệ pháp lý",
    body: "Mọi yêu cầu pháp lý, khiếu nại bản quyền hoặc phản hồi liên quan điều khoản sử dụng vui lòng gửi về: support@vtos.vn.",
  },
];

export function LegalNotice(): JSX.Element {
  return (
    <GuestLayout bgColor="#f3f7ff">
      <main className="mx-auto w-full max-w-[980px] px-4 py-8 md:px-6 md:py-12">
        <PublicPageBreadcrumb
          className="mb-5"
          items={[
            { label: "Trang chủ", to: "/homepage" },
            { label: "Legal Notice" },
          ]}
        />

        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-soft-sm md:px-8 md:py-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Legal Notice
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
            Tài liệu pháp lý này cung cấp thông tin công khai về trách nhiệm vận hành, quyền sở hữu
            nội dung và phương thức liên hệ pháp lý của nền tảng VTOS.
          </p>
        </section>

        <section className="mt-5 space-y-3">
          {legalItems.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-soft-sm"
            >
              <h2 className="text-lg font-extrabold text-gray-900">{item.title}</h2>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {item.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </GuestLayout>
  );
}
