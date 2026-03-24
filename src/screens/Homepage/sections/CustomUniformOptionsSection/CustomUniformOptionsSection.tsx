import { Card, CardContent } from "../../../../components/ui/card";
import { motion } from "framer-motion";

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
    <section className="flex bg-white w-full flex-col items-center gap-5 px-4 py-16">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-[1311px] mb-6"
      >
        <h2 className="mb-1 w-full text-center [font-family:'Baloo_2',Helvetica] text-3xl font-bold leading-[1.2] text-[#332623] md:text-4xl">
          <span className="text-[#332623]">Kho Đồng Phục</span>
          <span className="text-[#9323a6]"> Đầy Đủ Cấp Học</span>
        </h2>

        <p className="mx-auto w-full max-w-[1014px] text-center [font-family:'Baloo_2',Helvetica] text-xl font-medium leading-[1.3] text-[#3f3331] md:text-xl">
          Khám phá cách AI giúp bạn thử đồng phục nhanh chóng
          </p>
      </motion.header>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.1 }}
        className=" mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {uniformCategories.map((category) => (
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              whileHover={{ 
                y: -12,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              key={category.label}
              className="cursor-pointer"
            >
              <Card
                className="relative overflow-hidden rounded-[20px] border-0 bg-gray-200 shadow-md transition-all duration-500 hover:shadow-2xl hover:border-[#9323a6]/30 border-transparent border"
              >
              <CardContent className="relative p-0">
                <img
                  className="h-auto w-full rounded-[20px] p-2.5 transition-transform duration-500 group-hover:scale-110"
                  alt={category.label}
                  src={category.image}
                />

                <div
                  className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center justify-center rounded-t-[20px] bg-gray-200 px-6 py-2 transition-colors duration-300"
                >
                  <span className="[font-family:'Baloo_2',Helvetica] text-center text-xl font-semibold text-black">
                    {category.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
