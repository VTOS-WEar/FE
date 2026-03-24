import { motion } from "framer-motion";
import { ArrowRight, MapPin, School as SchoolIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface School {
    id: number;
    name: string;
    logo: string;
    location: string;
    type: string;
}

const schools: School[] = [
    {
        id: 1,
        name: "THPT FPT Đà Nẵng",
        location: "Khu vực Liên Chiểu, Đà Nẵng",
        type: "Trung học phổ thông",
        logo: "https://api.builder.io/api/v1/image/assets/TEMP/80a6f435cb9e7087c210fa4c6d128f646beb5b25?width=620",
    },
    {
        id: 2,
        name: "THPT Phan Châu Trinh",
        location: "Hải Châu, Đà Nẵng",
        type: "Trung học phổ thông",
        logo: "https://api.builder.io/api/v1/image/assets/TEMP/7c56845c7a5a2ebc8fe7f65a9cc5d4e782dc9bd8?width=620",
    },
    {
        id: 3,
        name: "THCS Nguyễn Khuyến",
        location: "Cẩm Lệ, Đà Nẵng",
        type: "Trung học cơ sở",
        logo: "https://api.builder.io/api/v1/image/assets/TEMP/9fe81853a1e7cd043d2d3ec42b9a15d899760dd3?width=620",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
        },
    },
};

export const JoinedSchoolsSection = (): JSX.Element => {
    return (
        <section className="relative w-full overflow-hidden bg-white py-8 px-4 md:px-6 lg:px-8 ">
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#8b008b]/5 blur-3xl opacity-60" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#d96ede]/5 blur-3xl opacity-60" />

            <div className="relative mx-auto max-w-[1050px]">
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div className="space-y-2">
                        <h2 className="[font-family:'Baloo_2',Helvetica] text-3xl font-bold text-[#1a1a1a] md:text-4xl">
                            Trường học tham gia
                        </h2>
                    </div>

                    <Link
                        to="/all-schools"
                        className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#8b008b]/20 bg-white text-[#8b008b] font-semibold hover:bg-[#8b008b] hover:text-white transition-all duration-500 shadow-sm"
                    >
                        <span className="[font-family:'Baloo_2',Helvetica] text-base">Xem tất cả</span>
                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                </div>

                {/* Schools Cards Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {schools.map((school) => (
                        <motion.div
                            key={school.id}
                            variants={itemVariants}
                            whileHover={{
                                y: -12,
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                            }}
                            className="shadow-lg group relative flex flex-col items-center overflow-hidden rounded-[24px] border border-[#e2e8f0]/60 bg-white mb-12 p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.2)] cursor-pointer"
                        >
                            {/* Decorative Badge */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="p-2 rounded-full bg-transparent text-[#8b008b]">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Logo Container */}
                            <div className="relative flex h-48 w-full items-center justify-center rounded-2xl bg-[#fdfaff] p-6 mb-6 group-hover:bg-white transition-colors duration-500">
                                <motion.img
                                    src={school.logo}
                                    alt={school.name}
                                    className="max-h-32 max-w-full object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        const target = e.target as HTMLImageElement;
                                        if (school.id === 1) target.src = "https://thpthaiphong.fpt.edu.vn/wp-content/uploads/2023/12/logo-FPTschool-01.png";
                                        else if (school.id === 2) target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_PCT.png/600px-Logo_PCT.png";
                                        else if (school.id === 3) target.src = "https://upload.wikimedia.org/wikipedia/commons/2/23/Nguyen_Khuyen_middle_school_logo.png";
                                    }}
                                />
                            </div>

                            {/* School Info */}
                            <div className="w-full text-center space-y-3">
                                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-tight">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 italic">{school.type}</span>
                                </div>

                                <h3 className="[font-family:'Baloo_2',Helvetica] text-2xl font-bold leading-tight text-[#1a1a1a] group-hover:text-[#8b008b] transition-colors duration-300">
                                    {school.name}
                                </h3>

                                <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="font-medium text-gray-400">{school.location}</span>
                                </div>
                            </div>

                            {/* Bottom Accent Line */}
                            <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-[#8b008b] to-[#d96ede] transition-all duration-500 group-hover:w-full" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
