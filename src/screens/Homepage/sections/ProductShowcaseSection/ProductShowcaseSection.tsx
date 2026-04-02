const categories = ["Tiểu học", "THCS", "THPT", "Thể dục"];

const showcaseImages = [
  {
    id: "original-image",
    src: "https://api.builder.io/api/v1/image/assets/TEMP/6150de8fdb5f524f53156fc41728708d3d4ce15e?width=2434s",
    caption: "Ảnh gốc của bạn",
    rotate: "-2deg",
    revealDir: "nb-reveal-left",
  },
  {
    id: "after-tryon-image",
    src: "https://i.ibb.co/Pvscprsd/Image-w-full.png",
    caption: "Sau khi thử đồng phục ✦",
    rotate: "2deg",
    revealDir: "nb-reveal-right",
  },
];

export const ProductShowcaseSection = (): JSX.Element => {
  return (
    <section className="nb-section-calm">
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-8">
        {/* Header */}
        <header className="mx-auto max-w-[700px] text-center mb-14 nb-reveal">
          <h2 className="text-3xl font-extrabold leading-[1.15] text-[#1A1A2E] md:text-4xl">
            Kết quả thực tế
          </h2>
          <p className="mt-3 text-lg font-medium leading-relaxed text-[#4C5769]">
            Chỉ cần tải ảnh lên — AI tạo hình bạn mặc đồng phục ngay lập tức
          </p>
        </header>

        {/* Before/After Images */}
        <div className="mx-auto mt-12 grid w-fit grid-cols-2 gap-8 md:gap-12">
          {showcaseImages.map((image) => (
            <div
              key={image.id}
              className={`group w-[40vw] max-w-[430px] min-w-[150px] ${image.revealDir}`}
              style={{ transform: `rotate(${image.rotate})` }}
            >
              <div className="nb-card-static overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0_#1A1A2E]">
                <div className="relative">
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="h-[340px] lg:h-[400px] w-full object-cover object-center"
                  />
                  <div className="absolute bottom-3 left-3 rounded-lg bg-[#B8A9E8] px-3 py-1.5 border-3 border-[#1A1A2E] font-bold text-[#1A1A2E] text-sm shadow-[3px_3px_0_#1A1A2E]">
                    {image.caption}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category badges (support accent — cyan) */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 nb-reveal">
          <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Hỗ trợ:</span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="nb-badge nb-badge-blue"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
