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
    <section className="nb-section-calm py-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8 lg:px-12">
        {/* Header */}
        <header className="mx-auto mb-7 max-w-[700px] text-center nb-reveal lg:mb-8">
          <h2 className="text-3xl font-extrabold leading-[1.15] text-gray-900 md:text-4xl">
            Kết quả thực tế
          </h2>
          <p className="mt-3 text-lg font-medium leading-relaxed text-gray-600">
            Chỉ cần tải ảnh lên — AI tạo hình bạn mặc đồng phục ngay lập tức
          </p>
        </header>

        {/* Before/After Images */}
        <div className="mx-auto grid w-fit grid-cols-2 gap-6 md:gap-8">
          {showcaseImages.map((image) => (
            <div
              key={image.id}
              className={`group w-[40vw] max-w-[430px] min-w-[150px] ${image.revealDir}`}
              style={{ transform: `rotate(${image.rotate})` }}
            >
              <div className="nb-card-static overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="relative">
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="h-[340px] lg:h-[400px] w-full object-cover object-center"
                  />
                  <div className="absolute bottom-3 left-3 rounded-lg bg-purple-400 px-3 py-1.5 border-3 border-gray-200 font-bold text-gray-900 text-sm shadow-soft-sm">
                    {image.caption}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category badges (support accent — cyan) */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 nb-reveal lg:mt-8">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hỗ trợ:</span>
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
