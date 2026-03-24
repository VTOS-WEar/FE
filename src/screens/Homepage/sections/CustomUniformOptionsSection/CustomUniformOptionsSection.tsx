import { Card, CardContent } from "../../../../components/ui/card";

const uniformCategories = [
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/e3defdf92d068d668152ccfe742e9151eef887df?width=596",
    label: "Tiểu học",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
    label: "THCS",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/ed766d21bca5438c8806828f3173e1b87b085ebf?width=596",
    label: "THPT",
  },
  {
    image: "https://api.builder.io/api/v1/image/assets/TEMP/494a01f52ff7ab433c4802d5684890349010cb4a?width=596",
    label: "Thể dục",
  },
];

export const CustomUniformOptionsSection = (): JSX.Element => {
  return (
    <section className="flex bg-white w-full flex-col items-center gap-5 px-4 py-8 md:gap-6 md:py-10 lg:gap-7">
      <header className="w-full max-w-[1311px] mb-6">
        <h2 className="mb-1 w-full translate-y-[-1rem] animate-fade-in text-center [font-family:'Baloo_2',Helvetica] text-3xl font-bold leading-[1.2] text-[#332623] opacity-0 md:text-4xl">
          <span className="text-[#332623]">Kho Đồng Phục</span>
          <span className="text-[#9323a6]"> Đầy Đủ Cấp Học</span>
        </h2>

        <p className="mx-auto w-full max-w-[1014px] translate-y-[-1rem] animate-fade-in text-center [font-family:'Baloo_2',Helvetica] text-xl font-medium leading-[1.3] text-[#3f3331] opacity-0 [--animation-delay:200ms] md:text-xl">
          Khám phá cách AI giúp bạn thử đồng phục nhanh chóng
        </p>
      </header>

      <div className=" mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 translate-y-[-1rem] animate-fade-in opacity-0 sm:grid-cols-2 lg:grid-cols-4 [--animation-delay:400ms]">
        {uniformCategories.map((category) => (
            <Card
              key={category.label}
              className="relative overflow-hidden rounded-[20px] border-0 bg-gray-200 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
            >
            <CardContent className="relative p-0">
              <img
                className="h-auto w-full rounded-[20px] p-2.5"
                alt={category.label}
                src={category.image}
              />

              <div
                className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center justify-center rounded-t-[20px] bg-gray-200 px-4 py-1.5"
              >
                <span className="[font-family:'Baloo_2',Helvetica] text-center text-xl font-semibold text-black">
                  {category.label}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
