import { GuestLayout } from "../../components/layout/GuestLayout";
import { Link } from "react-router-dom";

const roles = [
  {
    key: "parent",
    emoji: "👨‍👩‍👧",
    title: "Phụ huynh",
    description: "Đặt đồng phục, theo dõi đơn hàng, thử ảo AI",
    bg: "bg-gradient-to-b from-[#F4F0FF] to-[#E8E1FF]",
    link: "/signup/parent",
    btnText: "Đăng ký",
    btnClass: "from-[#B8A9E8] via-[#C8BCEF] to-[#A996E2]",
  },
  {
    key: "school",
    emoji: "🏫",
    title: "Quản lý trường",
    description: "Liên hệ để được cấp tài khoản quản lý",
    bg: "bg-gradient-to-b from-[#EFF7FF] to-[#E1EEFF]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
    btnClass: "from-[#B7D8FF] via-[#C8E1FF] to-[#9FC8FF]",
  },
  {
    key: "provider",
    emoji: "🏭",
    title: "Nhà cung cấp",
    description: "Liên hệ để trở thành đối tác cung cấp",
    bg: "bg-gradient-to-b from-[#FFF8EB] to-[#FFEFD8]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
    btnClass: "from-[#FFDFA8] via-[#FFE7BB] to-[#FFD08C]",
  },
];

export const RoleSelect = (): JSX.Element => {
  return (
    <GuestLayout bgColor="#f9fafb">
      <main className="nb-page flex-1 px-4 py-10 lg:py-20 nb-fade-in">
        <div className="mx-auto w-full max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="font-extrabold text-gray-900 text-3xl lg:text-4xl mb-2 tracking-tight leading-tight">
              Tạo tài khoản mới <span className="text-[#7C3AED]">✦</span>
            </h1>
            <div className="mx-auto mb-3 h-1 w-28 rounded-full bg-gradient-to-r from-[#EDE9FE] via-[#B8A9E8] to-[#EDE9FE]" />
            <p className="font-bold text-gray-500 text-base lg:text-lg">
              Chọn loại tài khoản phù hợp với bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 nb-stagger items-stretch">
            {roles.map((role, idx) => (
              <Link
                key={role.key}
                to={role.link}
                className={`group relative overflow-visible nb-card text-center px-5 py-6 ${role.bg} h-full min-h-[340px] flex flex-col items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md hover:ring-2 hover:ring-purple-300/40`}
              >
                <span className="nb-role-sparkle -right-2 top-1 text-base text-[#7C3AED]" style={{ ["--sx" as any]: "12px", ["--sy" as any]: "-14px", animationDelay: "0ms" }}>
                  ✦
                </span>
                <span className="nb-role-sparkle right-10 top-5 text-sm text-[#A996E2]" style={{ ["--sx" as any]: "5px", ["--sy" as any]: "-18px", animationDelay: "90ms" }}>
                  ✨
                </span>
                <span className="nb-role-sparkle left-3 top-2 text-xs text-purple-400" style={{ ["--sx" as any]: "-7px", ["--sy" as any]: "-14px", animationDelay: "140ms" }}>
                  ✦
                </span>
                <span className="nb-role-sparkle -left-2 bottom-14 text-sm text-[#7C3AED]" style={{ ["--sx" as any]: "-12px", ["--sy" as any]: "10px", animationDelay: "190ms" }}>
                  ✦
                </span>
                <div className="w-full">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-white/70 shadow-sm text-3xl">
                    {role.emoji}
                  </div>
                  <h2 className="font-extrabold text-gray-900 text-[28px] leading-tight mb-3">
                    {role.title}
                  </h2>
                  <p className="font-semibold text-[#5B6476] text-[15px] leading-relaxed min-h-[72px] px-1">
                    {role.description}
                  </p>
                </div>

                <div className={`mt-6 inline-flex h-11 w-full max-w-[170px] items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-r ${role.btnClass} px-4 text-sm font-extrabold text-gray-900 shadow-soft-md transition-all duration-200 group-hover:shadow-soft-md group-hover:brightness-[1.05] group-active:translate-y-px group-active:shadow-sm`}>
                  {role.btnText} {idx === 0 ? "→" : "↗"}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center mt-8 font-medium text-sm lg:text-base">
            <span className="text-gray-600">Bạn đã có tài khoản? </span>
            <Link
              to="/signin"
              className="font-bold text-gray-900 hover:text-purple-500 border-b-2 border-purple-300 transition-colors"
            >
              Đăng Nhập
            </Link>
          </p>
        </div>
      </main>
    </GuestLayout>
  );
};
