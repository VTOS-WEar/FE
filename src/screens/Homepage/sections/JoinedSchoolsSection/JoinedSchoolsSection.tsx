import { ArrowRight, MapPin } from "lucide-react";
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

export const JoinedSchoolsSection = (): JSX.Element => {
  return (
    <section className="nb-section-calm">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 nb-reveal">
          <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
            Trường học tham gia
          </h2>

          <Link
            to="/all-schools"
            className="nb-btn nb-btn-outline text-sm flex items-center gap-2"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* School Cards — all neutral white (Rule 4: no competing accents) */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 nb-reveal-stagger">
          {schools.map((school) => (
            <div
              key={school.id}
              className="nb-card group flex flex-col items-center p-8 cursor-pointer"
            >
              {/* Logo Container */}
              <div className="relative flex h-44 w-full items-center justify-center rounded-xl bg-gray-50 p-6 mb-6 border-3 border-gray-200/10">
                <img
                  src={school.logo}
                  alt={school.name}
                  className="max-h-28 max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    if (school.id === 1) target.src = "https://thpthaiphong.fpt.edu.vn/wp-content/uploads/2023/12/logo-FPTschool-01.png";
                    else if (school.id === 2) target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_PCT.png/600px-Logo_PCT.png";
                    else if (school.id === 3) target.src = "https://upload.wikimedia.org/wikipedia/commons/2/23/Nguyen_Khuyen_middle_school_logo.png";
                  }}
                />
              </div>

              {/* School Info */}
              <div className="w-full text-center space-y-2">
                <span className="nb-badge nb-badge-purple text-xs uppercase tracking-wider">
                  {school.type}
                </span>

                <h3 className="text-xl font-extrabold leading-tight text-gray-900">
                  {school.name}
                </h3>

                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">{school.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
