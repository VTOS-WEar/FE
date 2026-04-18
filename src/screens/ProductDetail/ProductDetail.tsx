import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ShoppingCart, Box, Star, Check, User } from "lucide-react";
import { useState } from "react";
import TryOnModal from "../../components/TryOnModal";

export default function ProductDetail() {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState("M");
  const [activeTab, setActiveTab] = useState("description");
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const isSizeAvailable = (size: string) => size !== "XXL";

  // Mock related products
  const relatedProducts = [
    {
      id: 1,
      name: "Quần tây xanh đen",
      price: "220.000 VNĐ",
      imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
      category: "THPT - Nam"
    },
    {
      id: 2,
      name: "Quần tây xanh đen",
      price: "220.000 VNĐ",
      imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
      category: "THPT - Nam"
    },
    {
      id: 3,
      name: "Quần tây xanh đen",
      price: "220.000 VNĐ",
      imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
      category: "THPT - Nam"
    },
    {
      id: 4,
      name: "Quần tây xanh đen",
      price: "220.000 VNĐ",
      imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
      category: "THPT - Nam"
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-6">
        <div className="flex items-center gap-2.5 text-base">
          <Link to="/" className="font-montserrat text-black/40 hover:text-black transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to="/schools" className="font-montserrat text-black/40 hover:text-black transition-colors">
            Trường THPT Phan Châu Trinh
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat text-black/40">Đồng phục nam</span>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black">Áo sơ mi nam</span>
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 shadow-soft-md">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596"
                alt="Áo sơ mi trắng nam"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200 hover:border-vtos-blue transition-colors cursor-pointer">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596"
                    alt={`Thumbnail ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right - Product Info */}
          <div className="space-y-6">
            {/* School Info */}
            <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-soft-md hover:-translate-y-1 hover:shadow-soft-md transition-all duration-300 ease-in-out">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/7c56845c7a5a2ebc8fe7f65a9cc5d4e782dc9bd8?width=200"
                alt="THPT Phan Châu Trinh logo"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <p className="font-montserrat font-semibold text-lg text-black">
                  THPT Phan Châu Trinh - Đà Nẵng
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 rounded-full px-4 py-2 shadow-soft-sm border border-gray-200 transition-all duration-300">
                <Check className="w-4 h-4 text-white" />
                <span className="font-montserrat font-semibold text-sm text-white">
                  Đã xác thực
                </span>
              </div>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-black mb-4">
                Áo sơ mi trắng nam
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="font-montserrat font-semibold text-sm text-black">
                  4.2 (128 đánh giá)
                </span>
              </div>

              {/* Price */}
              <p className="font-montserrat font-bold text-5xl text-blue-accent mb-6">
                250.000 VNĐ
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="font-montserrat font-medium text-base text-black/60 leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
                when an unknown printer took a galley of type and scrambled it to make a type
                specimen book. It has survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
              </p>
            </div>

            {/* Size Selection */}
            <div>
              <label className="font-montserrat font-semibold text-base text-black mb-3 block">
                Chọn kích thước
              </label>
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => isSizeAvailable(size) && setSelectedSize(size)}
                    disabled={!isSizeAvailable(size)}
                    className={`px-6 py-3 rounded-lg font-montserrat text-xl transition-all duration-300 ease-in-out transform ${selectedSize === size
                      ? "bg-blue-accent text-white border-2 border-blue-accent shadow-md scale-105"
                      : isSizeAvailable(size)
                        ? "bg-white text-black border-2 border-vtos-gray-border hover:border-vtos-blue hover:scale-105 active:scale-95"
                        : "bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-50"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => {
                  alert("Vui lòng chọn chiến dịch mua đồng phục tại trang trường để đặt hàng.");
                  navigate("/schools");
                }}
                className="flex-1 flex items-center justify-center gap-3 bg-blue-accent hover:bg-blue-accent/90 text-white font-montserrat font-bold text-xl px-12 py-5 rounded-lg border border-gray-200 shadow-soft-md hover:scale-[0.98] hover:shadow-sm transition-all duration-300 ease-in-out"
              >
                <ShoppingCart className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                Thêm vào giỏ hàng
              </button>
              <button
                onClick={() => setIsTryOnOpen(true)}
                className="flex-1 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-blue-accent border-2 border-blue-accent font-montserrat font-bold text-xl px-12 py-5 rounded-lg transition-all duration-300 ease-in-out hover:border-blue-accent/80 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Box className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
                Thử Ảo (VR)
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          {/* Tab Navigation */}
          <div className="flex items-center gap-12 border-b-2 border-vtos-gray-border mb-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-4 font-montserrat font-semibold text-2xl transition-all duration-300 ease-in-out ${activeTab === "description"
                ? "text-blue-accent border-b-2 border-blue-accent -mb-[2px]"
                : "text-black/50 hover:text-black/70"
                }`}
            >
              Mô tả chi tiết
            </button>
            <button
              onClick={() => setActiveTab("material")}
              className={`pb-4 font-montserrat font-semibold text-2xl transition-all duration-300 ease-in-out ${activeTab === "material"
                ? "text-blue-accent border-b-2 border-blue-accent -mb-[2px]"
                : "text-black/50 hover:text-black/70"
                }`}
            >
              Chất liệu & Bảo quản
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-montserrat font-semibold text-2xl transition-all duration-300 ease-in-out ${activeTab === "reviews"
                ? "text-blue-accent border-b-2 border-blue-accent -mb-[2px]"
                : "text-black/50 hover:text-black/70"
                }`}
            >
              Đánh giá (128)
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-soft-md">
            {activeTab === "description" && (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-accent mt-1 flex-shrink-0" />
                  <p className="font-montserrat text-2xl text-black">
                    <span className="font-bold">Chất liệu: </span>
                    <span className="font-normal">Bề mặt vải mịn, không xù lông, giữ form dáng tốt.</span>
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-accent mt-1 flex-shrink-0" />
                  <p className="font-montserrat text-2xl text-black">
                    <span className="font-bold">Thiết kế hiện đại: </span>
                    <span className="font-normal">Form Slim-fit tôn dáng nhưng vẫn đảm bảo sự thoải mái khi vận động.</span>
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-blue-accent mt-1 flex-shrink-0" />
                  <p className="font-montserrat text-2xl text-black">
                    <span className="font-bold">Phù hợp tiêu chuẩn: </span>
                    <span className="font-normal">Áo sơ mi chuẩn theo quy định đồng phục THPT Phan Châu Trinh.</span>
                  </p>
                </div>
              </div>
            )}

            {activeTab === "material" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-montserrat font-bold text-2xl text-black mb-4">
                    Chất liệu
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Vải Polyester 65% + Cotton 35%:</span> Vải có độ bền cao, không nhăn, dễ giặt và nhanh khô.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Công nghệ chống nhăn:</span> Giữ form dáng tốt sau nhiều lần giặt, không cần ủi thường xuyên.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Thoáng khí:</span> Chất liệu thấm hút mồ hôi tốt, phù hợp mặc cả ngày.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Màu sắc bền:</span> Công nghệ nhuộm cao cấp, màu trắng không bị ố vàng theo thời gian.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-montserrat font-bold text-2xl text-black mb-4">
                    Hướng dẫn bảo quản
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Giặt máy:</span> Giặt ở nhiệt độ 30-40°C, sử dụng chế độ giặt nhẹ. Không sử dụng chất tẩy có chứa clo.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Phơi khô:</span> Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp để giữ màu sắc. Có thể phơi ngược để tránh ố vàng.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Ủi:</span> Ủi ở nhiệt độ thấp (110-150°C), không cần ủi thường xuyên do vải có khả năng chống nhăn.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-accent mt-1 flex-shrink-0" />
                      <p className="font-montserrat text-lg text-black/80">
                        <span className="font-semibold">Bảo quản:</span> Treo trên móc áo, tránh gấp nếp để giữ form dáng. Bảo quản nơi khô ráo, thoáng mát.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="flex items-center gap-8 pb-6 border-b border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="font-montserrat font-bold text-5xl text-black">4.2</span>
                      <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="font-montserrat text-base text-black/60">128 đánh giá</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="font-montserrat text-sm text-black/60 w-8">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${rating === 5 ? 65 : rating === 4 ? 20 : rating === 3 ? 10 : rating === 2 ? 3 : 2}%` }}
                          />
                        </div>
                        <span className="font-montserrat text-sm text-black/60 w-12 text-right">
                          {rating === 5 ? 83 : rating === 4 ? 26 : rating === 3 ? 13 : rating === 2 ? 4 : 2}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review List */}
                <div className="space-y-6">
                  {/* Review 1 */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-accent" />
                        </div>
                        <div>
                          <p className="font-montserrat font-semibold text-lg text-black">Nguyễn Văn A</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-montserrat text-sm text-black/40">2 ngày trước</span>
                    </div>
                    <p className="font-montserrat text-base text-black/80 leading-relaxed">
                      Áo rất đẹp, chất liệu tốt và mặc rất thoải mái. Form dáng chuẩn, không bị nhăn sau khi giặt. Màu trắng sáng, phù hợp với quy định của trường. Rất hài lòng với sản phẩm này!
                    </p>
                  </div>

                  {/* Review 2 */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-accent" />
                        </div>
                        <div>
                          <p className="font-montserrat font-semibold text-lg text-black">Trần Thị B</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-montserrat text-sm text-black/40">5 ngày trước</span>
                    </div>
                    <p className="font-montserrat text-base text-black/80 leading-relaxed">
                      Chất lượng tốt, giá cả hợp lý. Áo mặc rất mát và thoải mái, đặc biệt là vào những ngày nắng nóng. Size vừa vặn, không bị rộng hay chật. Sẽ mua thêm cho năm học sau.
                    </p>
                  </div>

                  {/* Review 3 */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-accent" />
                        </div>
                        <div>
                          <p className="font-montserrat font-semibold text-lg text-black">Lê Văn C</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-montserrat text-sm text-black/40">1 tuần trước</span>
                    </div>
                    <p className="font-montserrat text-base text-black/80 leading-relaxed">
                      Áo đúng như mô tả, chất liệu bền và dễ giặt. Màu sắc đẹp, không bị phai sau nhiều lần giặt. Giao hàng nhanh, đóng gói cẩn thận. Đáng giá tiền bỏ ra.
                    </p>
                  </div>

                  {/* Review 4 */}
                  <div className="border-b border-gray-100 pb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-accent" />
                        </div>
                        <div>
                          <p className="font-montserrat font-semibold text-lg text-black">Phạm Thị D</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-montserrat text-sm text-black/40">2 tuần trước</span>
                    </div>
                    <p className="font-montserrat text-base text-black/80 leading-relaxed">
                      Sản phẩm chất lượng tốt, form dáng đẹp. Áo mặc rất thoải mái và phù hợp với quy định đồng phục của trường. Giá cả hợp lý so với chất lượng. Khuyến khích các bạn nên mua.
                    </p>
                  </div>

                  {/* Review 5 */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-accent" />
                        </div>
                        <div>
                          <p className="font-montserrat font-semibold text-lg text-black">Hoàng Văn E</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i <= 3 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-montserrat text-sm text-black/40">3 tuần trước</span>
                    </div>
                    <p className="font-montserrat text-base text-black/80 leading-relaxed">
                      Áo ổn, chất lượng tạm được. Mặc khá thoải mái nhưng có thể cải thiện thêm về độ dày của vải. Nhìn chung là hài lòng với sản phẩm.
                    </p>
                  </div>
                </div>

                {/* Load More Button */}
                <div className="pt-4 text-center">
                  <button className="font-montserrat font-semibold text-lg text-blue-accent hover:text-blue-accent/80 transition-colors">
                    Xem thêm đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-montserrat font-bold text-3xl text-black">
              Có thể bạn cũng thích
            </h2>
            <Link
              to="/products"
              className="flex items-center gap-2 text-blue-accent hover:opacity-80 transition-opacity"
            >
              <span className="font-montserrat font-medium text-xl">Xem tất cả</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-soft-md hover:shadow-soft-md transition-all duration-300 ease-in-out hover:-translate-y-1 group"
              >
                <div className="relative w-full aspect-square overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  />
                </div>
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-montserrat font-bold text-base text-black flex-1">
                      {product.name}
                    </h3>
                    <p className="font-montserrat font-bold text-base text-black ml-2">
                      {product.price}
                    </p>
                  </div>
                  <p className="font-montserrat font-normal text-sm text-black/50">
                    {product.category}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Try On Modal */}
      <TryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        suggestedSize={selectedSize}
        fitPercentage={93}
      />
    </div>
  );
}
