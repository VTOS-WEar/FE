import { X, Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedSize?: string;
  fitPercentage?: number;
}

export const TryOnModal = ({ isOpen, onClose, suggestedSize = "M", fitPercentage = 93 }: TryOnModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-[1350px] max-h-[90vh] mx-4 rounded-xl overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {/* Content */}
        <div className="bg-white w-full min-h-[600px] relative p-8 overflow-y-auto max-h-[90vh]">
          <p className="mb-8 font-montserrat font-semibold text-[#4c5769] text-2xl md:text-3xl">
            Bạn đang trải nghiệm phòng thử ảo
          </p>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left - Image Preview */}
            <div className="flex-shrink-0">
              <div className="relative w-full max-w-[500px] aspect-[0.73] rounded-[10px] overflow-hidden bg-gray-100">
                <img
                  className="w-full h-full object-cover"
                  alt="Try on preview"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/80a6f435cb9e7087c210fa4c6d128f646beb5b25?width=620"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-4 mt-4">
                <button className="flex items-center justify-center px-4 py-3 bg-[#decfff] hover:bg-[#d0bfff] rounded-[10px] shadow-md transition-all duration-300 hover:scale-105">
                  <span className="font-montserrat font-extrabold text-[#7e45d9] text-base">
                    Up ảnh khác
                  </span>
                </button>
                <button className="w-[70px] h-[70px] bg-[#decfff] hover:bg-[#d0bfff] rounded-[10px] flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105">
                  <RotateCcw className="w-6 h-6 text-[#7e45d9]" />
                </button>
                <button className="w-[70px] h-[70px] bg-[#decfff] hover:bg-[#d0bfff] rounded-[10px] flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105">
                  <RotateCw className="w-6 h-6 text-[#7e45d9]" />
                </button>
                <button className="w-[70px] h-[70px] bg-[#decfff] hover:bg-[#d0bfff] rounded-[10px] flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105">
                  <ZoomIn className="w-6 h-6 text-[#7e45d9]" />
                </button>
                <button className="w-[70px] h-[70px] bg-[#decfff] hover:bg-[#d0bfff] rounded-[10px] flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105">
                  <ZoomOut className="w-6 h-6 text-[#7e45d9]" />
                </button>
              </div>
            </div>

            {/* Right - Info Panels */}
            <div className="flex-1 space-y-6">
              {/* Suggested Size Panel */}
              <div className="w-full bg-[#ebf3fd] rounded-[10px] p-8">
                <div className="flex flex-col items-center gap-4">
                  <p className="font-montserrat font-medium text-[#4c5769] text-xl md:text-2xl text-center">
                    Size gợi ý cho bạn
                  </p>
                  <div className="font-montserrat font-extrabold text-[#3c6efd] text-8xl md:text-9xl">
                    {suggestedSize}
                  </div>
                  <p className="font-montserrat font-medium text-xl md:text-2xl text-[#4c5769] text-center">
                    Phù hợp{" "}
                    <span className="font-extrabold text-black">{fitPercentage}%</span> - Form chuẩn
                  </p>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="w-full bg-[#f6f6f6] rounded-[10px] border border-[#999999] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-[#999999] hover:bg-[#888888] opacity-50 cursor-not-allowed flex items-center justify-center gap-2.5 px-2.5 py-5 rounded-[10px] border border-[#cac9d6] shadow-md transition-all duration-300">
                    <span className="font-montserrat font-semibold text-black text-xl">
                      Lưu size
                    </span>
                  </button>
                  <button className="flex-1 bg-[#999999] hover:bg-[#888888] opacity-50 cursor-not-allowed flex items-center justify-center gap-2.5 px-2.5 py-5 rounded-[10px] border border-[#cac9d6] shadow-md transition-all duration-300">
                    <span className="font-montserrat font-semibold text-black text-xl">
                      Chia sẻ
                    </span>
                  </button>
                </div>

                <button className="w-full bg-white hover:bg-gray-50 flex items-center justify-center gap-2.5 px-2.5 py-5 rounded-[10px] border border-[#cac9d6] shadow-md transition-all duration-300">
                  <Upload className="w-6 h-6 text-black" />
                  <span className="font-montserrat font-semibold text-black text-xl">
                    Tải ảnh tham chiếu size
                  </span>
                </button>

                <button className="w-full bg-[#4182f9] hover:bg-[#3c6efd] flex items-center justify-center gap-2.5 px-2.5 py-5 rounded-[10px] border border-[#3c6efd] shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                  <span className="font-montserrat font-bold text-white text-2xl md:text-4xl">
                    Mua với size {suggestedSize}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryOnModal;
