import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";

const sections = [
  {
    title: "1. Cookie là gì?",
    content:
      "Cookie là tệp nhỏ được lưu trên thiết bị để ghi nhớ lựa chọn của bạn, giúp website hoạt động ổn định và cải thiện trải nghiệm sử dụng.",
  },
  {
    title: "2. Cookie chúng tôi sử dụng",
    content:
      "VTOS sử dụng cookie cần thiết để duy trì phiên đăng nhập, cookie hiệu năng để đo lường tốc độ tải trang và cookie phân tích để hiểu hành vi sử dụng tổng quan.",
  },
  {
    title: "3. Mục đích sử dụng",
    content:
      "Thông tin từ cookie được dùng để tối ưu giao diện, giảm lỗi hiển thị, ghi nhớ tùy chọn người dùng và nâng cao chất lượng dịch vụ thử đồng phục bằng AI.",
  },
  {
    title: "4. Quản lý cookie",
    content:
      "Bạn có thể thay đổi cài đặt cookie trong trình duyệt bất kỳ lúc nào. Việc tắt cookie cần thiết có thể khiến một số tính năng của hệ thống không hoạt động đúng.",
  },
  {
    title: "5. Cập nhật chính sách",
    content:
      "Chính sách cookie có thể được cập nhật theo yêu cầu vận hành và pháp lý. Mọi thay đổi quan trọng sẽ được công bố trên trang này.",
  },
];

export function CookiesPolicy(): JSX.Element {
  return (
    <GuestLayout bgColor="#f3f7ff">
      <main className="mx-auto w-full max-w-[980px] px-4 py-8 md:px-6 md:py-12">
        <PublicPageBreadcrumb
          className="mb-5"
          items={[
            { label: "Trang chủ", to: "/homepage" },
            { label: "Cookies Policy" },
          ]}
        />

        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-soft-sm md:px-8 md:py-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Cookies Policy
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
            Cập nhật lần cuối: 27/04/2026. Chính sách này giải thích cách VTOS sử dụng cookie
            để vận hành nền tảng, phân tích hiệu năng và tối ưu trải nghiệm người dùng.
          </p>
        </section>

        <section className="mt-5 space-y-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-soft-sm"
            >
              <h2 className="text-lg font-extrabold text-gray-900">{section.title}</h2>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-600 md:text-base">
                {section.content}
              </p>
            </article>
          ))}
        </section>
      </main>
    </GuestLayout>
  );
}
