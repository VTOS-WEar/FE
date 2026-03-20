import { GuestLayout } from "../../components/layout/GuestLayout";
import { Link } from "react-router-dom";

const roles = [
  {
    key: "parent",
    emoji: "👨‍👩‍👧",
    title: "Phụ huynh",
    description: "Đặt đồng phục, theo dõi đơn hàng, thử ảo AI",
    color: "from-[#6938ef] to-[#9b6dff]",
    hoverBorder: "hover:border-[#6938ef]",
    link: "/signup/parent",
    btnText: "Đăng ký",
  },
  {
    key: "school",
    emoji: "🏫",
    title: "Quản lý trường",
    description: "Liên hệ để được cấp tài khoản quản lý",
    color: "from-[#0ea5e9] to-[#38bdf8]",
    hoverBorder: "hover:border-[#0ea5e9]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
  },
  {
    key: "provider",
    emoji: "🏭",
    title: "Nhà cung cấp",
    description: "Liên hệ để trở thành đối tác cung cấp",
    color: "from-[#f59e0b] to-[#fbbf24]",
    hoverBorder: "hover:border-[#f59e0b]",
    link: "/contact-partnership",
    btnText: "Liên hệ hợp tác",
  },
];

export const RoleSelect = (): JSX.Element => {
  return (
    <GuestLayout bgColor="#f4f2ff">
      <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl mb-3">
              Tạo tài khoản mới
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base lg:text-lg">
              Chọn loại tài khoản phù hợp với bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((role) => (
              <Link
                key={role.key}
                to={role.link}
                className={`group relative overflow-hidden rounded-2xl border-2 border-[#e5e3f0] bg-white p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${role.hoverBorder}`}
              >
                {/* Gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="text-5xl mb-4">{role.emoji}</div>
                <h2 className="[font-family:'Baloo_2',Helvetica] font-bold text-[#100f14] text-xl mb-2">
                  {role.title}
                </h2>
                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm leading-relaxed">
                  {role.description}
                </p>

                <div className={`mt-5 inline-flex items-center gap-1 bg-gradient-to-r ${role.color} text-white px-5 py-2.5 rounded-full [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-transform group-hover:scale-105`}>
                  {role.btnText}
                  <span className="ml-1">→</span>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center mt-8 [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
            <span className="text-[#494759]">Bạn đã có tài khoản? </span>
            <Link
              to="/signin"
              className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] hover:underline"
            >
              Đăng Nhập
            </Link>
          </p>
        </div>
      </main>
    </GuestLayout>
  );
};
