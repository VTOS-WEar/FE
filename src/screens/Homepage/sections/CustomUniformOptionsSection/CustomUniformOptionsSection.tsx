const uniformCategories = [
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/e3defdf92d068d668152ccfe742e9151eef887df?width=596",
    label: "Tiểu học",
    bg: "bg-[#A8D4E6]",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
    label: "THCS",
    bg: "bg-violet-50",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/ed766d21bca5438c8806828f3173e1b87b085ebf?width=596",
    label: "THPT",
    bg: "bg-emerald-400",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/494a01f52ff7ab433c4802d5684890349010cb4a?width=596",
    label: "Thể dục",
    bg: "bg-pink-200",
  },
];

export const CustomUniformOptionsSection = (): JSX.Element => {
  return (
    <section className="flex bg-white w-full flex-col items-center gap-5 px-4 pb-12">
      <header className="w-full max-w-[1311px] mb-6 text-center nb-reveal">
        <h2 className="mb-1 w-full font-extrabold text-3xl leading-[1.2] text-gray-900 md:text-4xl">
          <span>Kho Đồng Phục</span>{" "}
          <span className="text-purple-400">Đầy Đủ Cấp Học ✦</span>
        </h2>
        <p className="mx-auto w-full max-w-[1014px] text-lg font-medium leading-[1.4] text-gray-600 md:text-xl">
          Khám phá cách AI giúp bạn thử đồng phục nhanh chóng
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 nb-reveal-stagger">
        {uniformCategories.map((category) => (
          <div key={category.label} className="cursor-pointer group">
            <div className={`nb-card nb-tilt-hover overflow-hidden ${category.bg} hover:shadow-soft-md transition-all duration-300`}>
              <img
                className="h-auto w-full rounded-xl p-2 transition-transform duration-500 group-hover:scale-105"
                alt={category.label}
                src={category.image}
              />
              <div className="py-3 px-4 text-center border-t border-gray-200">
                <span className="font-extrabold text-xl text-gray-900">
                  {category.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
