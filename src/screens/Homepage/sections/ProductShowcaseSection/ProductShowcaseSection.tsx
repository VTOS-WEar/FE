import { Card, CardContent } from "../../../../components/ui/card";
import { motion } from "framer-motion";

export const ProductShowcaseSection = (): JSX.Element => {
  const showcaseImages = [
    {
      id: "original-image",
      src: "https://api.builder.io/api/v1/image/assets/TEMP/6150de8fdb5f524f53156fc41728708d3d4ce15e?width=2434s",
      caption: "Ảnh gốc của bạn",
    },
    {
      id: "after-tryon-image",
      src: "https://i.ibb.co/Pvscprsd/Image-w-full.png",
      caption: "Sau khi thử đồng phục ✨",
    },
  ];

  return (
    <section id="how-it-works" className="w-full bg-white py-24">
      <div className="mx-auto w-full max-w-[1300px] px-4 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-[1100px] text-center"
        >
          <h2 className="[font-family:'Baloo_2',Helvetica] text-3xl font-bold leading-[1.2] text-[#332623] md:text-4xl">
            <span className="text-[#9323a6]">Thử Nhanh - Chuẩn</span>
            <span> - Không Cần Studio</span>
          </h2>

          <p className="mt-2 [font-family:'Baloo_2',Helvetica] text-xl font-medium leading-[1.3] text-[#3f3331] md:text-xl">
            Chỉ với 3 bước: Tải ảnh chân dung - Chọn mẫu đồng phục - Nhận kết quả
          </p>
        </motion.header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.3 }}
          className="mx-auto mt-12 grid w-fit grid-cols-2 gap-10 md:gap-10"
        >
          {showcaseImages.map((image) => (
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
              key={image.id}
              className="group w-[44vw] max-w-[430px] min-w-[150px]"
            >
              <Card className="overflow-hidden rounded-[24px] border border-[#d8d8e2] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
                <CardContent className="p-0">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                    src={image.src}
                    alt={image.caption}
                    className="h-[420px] w-full object-cover object-center"
                  />
                  <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-4 py-1 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                    {image.caption}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
