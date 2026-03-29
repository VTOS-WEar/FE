import { GuestLayout } from "../../components/layout/GuestLayout";
import { Link } from "react-router-dom";

const roles = [
  {
    key: "parent",
    emoji: "👨‍👩‍👧",
    title: "Phụ huynh",
    description: "Đặt đồng phục, theo dõi đơn hàng, thử ảo AI",
    bg: "bg-[#EDE9FE]",
    link: "/signup/parent",
    btnText: "Đăng ký",
    btnClass: "nb-btn-purple",
  },
  {
    key: "school",
    emoji: "🏫",
    title: "Quản lý trường",
    description: "Liên hệ để được cấp tài khoản quản lý",
    bg: "bg-[#DAF0F7]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
    btnClass: "nb-btn-green",
  },
  {
    key: "provider",
    emoji: "🏭",
    title: "Nhà cung cấp",
    description: "Liên hệ để trở thành đối tác cung cấp",
    bg: "bg-[#FDF8D0]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
    btnClass: "nb-btn-yellow",
  },
];

export const RoleSelect = (): JSX.Element => {
  return (
    <GuestLayout bgColor="#FFF8F0">
      <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="font-extrabold text-[#1A1A2E] text-3xl lg:text-4xl mb-3">
              Tạo tài khoản mới ✦
            </h1>
            <p className="font-bold text-[#6B7280] text-base lg:text-lg">
              Chọn loại tài khoản phù hợp với bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 nb-stagger">
            {roles.map((role) => (
              <Link
                key={role.key}
                to={role.link}
                className={`group nb-card text-center p-6 ${role.bg}`}
              >
                <div className="text-5xl mb-4">{role.emoji}</div>
                <h2 className="font-extrabold text-[#1A1A2E] text-xl mb-2">
                  {role.title}
                </h2>
                <p className="font-medium text-[#6B7280] text-sm leading-relaxed">
                  {role.description}
                </p>

                <div className={`mt-5 nb-btn ${role.btnClass} text-sm`}>
                  {role.btnText} →
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center mt-8 font-medium text-sm lg:text-base">
            <span className="text-[#4C5769]">Bạn đã có tài khoản? </span>
            <Link
              to="/signin"
              className="font-bold text-[#1A1A2E] hover:text-[#B8A9E8] border-b-2 border-[#B8A9E8] transition-colors"
            >
              Đăng Nhập
            </Link>
          </p>
        </div>
      </main>
    </GuestLayout>
  );
};
