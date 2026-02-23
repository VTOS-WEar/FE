import { Search, ChevronDown, SlidersHorizontal, ChevronRight } from "lucide-react";
import { SchoolCard } from "../../components/SchoolCard";

export default function Index() {
    // Mock data for schools - in a real app this would come from an API
    const schools = [
        {
            name: "THPT FPT Đà Nẵng",
            address: "Khu đô thị FPT, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/80a6f435cb9e7087c210fa4c6d128f646beb5b25?width=620",
            hasUniform: true
        },
        {
            name: "THPT Phan Châu Trinh",
            address: "Lê Lợi, Hải Châu, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/7c56845c7a5a2ebc8fe7f65a9cc5d4e782dc9bd8?width=620",
            hasUniform: true
        },
        {
            name: "THCS Nguyễn Khuyến",
            address: "Lê Đình Lý, Thanh Khê, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/9fe81853a1e7cd043d2d3ec42b9a15d899760dd3?width=620",
            hasUniform: true
        },
        {
            name: "THCS FPT",
            address: "Khu đô thị FPT, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/e6f47c3517e1496d714491d6fedd45a237a67c13?width=630",
            hasUniform: true
        },
        {
            name: "THPT Trần Phú",
            address: "Lý Tự Trọng, Hải Châu, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/80a6f435cb9e7087c210fa4c6d128f646beb5b25?width=620",
            hasUniform: true
        },
        {
            name: "THCS Lý Tự Trọng",
            address: "Lý Tự Trọng, Hải Châu, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/7c56845c7a5a2ebc8fe7f65a9cc5d4e782dc9bd8?width=620",
            hasUniform: true
        },
        {
            name: "THPT Nguyễn Hiền",
            address: "Nguyễn Văn Linh, Thanh Khê, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/9fe81853a1e7cd043d2d3ec42b9a15d899760dd3?width=620",
            hasUniform: true
        },
        {
            name: "THCS Hoàng Diệu",
            address: "Hoàng Diệu, Hải Châu, Đà Nẵng",
            imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/e6f47c3517e1496d714491d6fedd45a237a67c13?width=630",
            hasUniform: true
        }
    ];

    return (
        <div className="bg-vtos-gray-light">
                {/* Breadcrumb */}
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-6">
                    <div className="flex items-center gap-2.5 text-base">
                        <span className="font-montserrat text-black/40">Trang chủ</span>
                        <ChevronRight className="w-4 h-4 text-black/40" />
                        <span className="font-montserrat font-semibold text-black">Danh sách trường</span>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mb-8">
                    <div className="mb-6">
                        <h1 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-black mb-2">
                            Tìm đồng phục trường của bạn
                        </h1>
                        <p className="font-montserrat font-medium text-lg lg:text-xl text-vtos-gray-text">
                            Chọn địa điểm hoặc tìm kiếm để xem danh sách trường học phù hợp
                        </p>
                    </div>

                    {/* Search/Filter Box */}
                    <div className="bg-white rounded-xl border border-vtos-gray-border p-6 lg:p-8 shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr,1fr,auto] gap-5 items-end">
                            {/* Search Input */}
                            <div className="flex flex-col gap-3">
                                <label className="font-montserrat font-bold text-base text-black">
                                    Tìm kiếm trường học
                                </label>
                                <div className="flex items-center gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px]">
                                    <Search className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên trường học..."
                                        className="flex-1 font-montserrat font-medium text-base text-vtos-gray-dark placeholder:text-vtos-gray-dark bg-transparent outline-none h-full"
                                    />
                                </div>
                            </div>

                            {/* Province Select */}
                            <div className="flex flex-col gap-3">
                                <label className="font-montserrat font-bold text-base text-black">
                                    Quận/Huyện
                                </label>
                                <div className="flex items-center justify-between gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px] cursor-pointer hover:border-vtos-blue transition-colors">
                                    <span className="font-montserrat font-medium text-base text-vtos-gray-dark">
                                        Chọn Tỉnh/Thành phố
                                    </span>
                                    <ChevronDown className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
                                </div>
                            </div>

                            {/* District Select */}
                            <div className="flex flex-col gap-3">
                                <label className="font-montserrat font-bold text-base text-black">
                                    Tỉnh/Thành phố
                                </label>
                                <div className="flex items-center justify-between gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px] cursor-pointer hover:border-vtos-blue transition-colors">
                                    <span className="font-montserrat font-medium text-base text-vtos-gray-dark">
                                        Chọn Quận/Huyện
                                    </span>
                                    <ChevronDown className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
                                </div>
                            </div>

                            {/* Filter Button */}
                            <button className="bg-purple-main hover:bg-purple-dark transition-colors rounded-lg px-5 h-[56px] flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg text-white">
                                <span className="font-montserrat font-bold text-base whitespace-nowrap">
                                    Lọc
                                </span>
                                <SlidersHorizontal className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
                    {/* Results Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <p className="font-montserrat text-base">
                            <span className="font-semibold text-vtos-gray-medium">Hiển thị </span>
                            <span className="font-extrabold text-black">8</span>
                            <span className="font-semibold text-vtos-gray-medium"> kết quả cho </span>
                            <span className="font-extrabold text-black">Đà Nẵng</span>
                        </p>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-10">
                            <span className="font-montserrat font-semibold text-base text-vtos-gray-text">
                                Sắp xếp:
                            </span>
                            <div className="flex items-center gap-2.5 cursor-pointer group">
                                <span className="font-montserrat font-bold text-base text-black">
                                    Phổ biến nhất
                                </span>
                                <ChevronDown className="w-6 h-6 text-black stroke-[2.5]" />
                            </div>
                        </div>
                    </div>

                    {/* School Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {schools.map((school, index) => (
                            <SchoolCard
                                key={index}
                                name={school.name}
                                address={school.address}
                                imageUrl={school.imageUrl}
                                hasUniform={school.hasUniform}
                            />
                        ))}
                    </div>
                </div>
        </div>
    );
}
