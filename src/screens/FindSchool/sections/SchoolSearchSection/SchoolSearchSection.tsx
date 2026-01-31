import { CheckCircle2Icon, SearchIcon } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

const schoolData = [
  {
    id: 1,
    name: "Vinschool Time City",
    address: "278 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos-1-3.png",
    selected: true,
  },
  {
    id: 2,
    name: "Vinschool Time City",
    address: "278 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos-1-3.png",
    selected: false,
  },
  {
    id: 3,
    name: "Vinschool Time City",
    address: "278 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos-1-3.png",
    selected: false,
  },
  {
    id: 4,
    name: "Vinschool Time City",
    address: "278 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos-1-3.png",
    selected: false,
  },
];

export const SchoolSearchSection = (): JSX.Element => {
  return (
    <section className="w-full max-w-[50rem] flex flex-col gap-6 lg:gap-[2.375rem] bg-white rounded-[1.875rem] shadow-[0px_0px_4px_#00000040] p-6 lg:p-[2rem_2.3rem] translate-y-[-1rem] animate-fade-in opacity-0">
      <header className="flex items-center justify-start gap-3 lg:gap-5">
        <Badge className="inline-flex items-center justify-center gap-2.5 p-[5px] bg-[#4182f933] rounded-[50px] hover:bg-[#4182f933] h-auto">
          <span className="flex items-center justify-center w-6 text-[#4182f9] text-xl text-center [font-family:'Montserrat',Helvetica] font-bold tracking-[0] leading-[normal]">
            1
          </span>
        </Badge>

        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl lg:text-[2rem] tracking-[0] leading-[normal]">
          Tìm kiếm trường học
        </h2>
      </header>

      <div className="flex flex-col items-start gap-[29px]">
        <div className="grid grid-cols-2 gap-[38px] w-full">
          <div className="flex flex-col gap-2.5">
            <label className="opacity-60 [font-family:'Montserrat',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              Tỉnh / Thành phố
            </label>

            <Select defaultValue="danang">
              <SelectTrigger className="w-full h-[50px] bg-white rounded-lg border border-solid border-[#00000036] px-2.5 py-[15px]">
                <SelectValue className="[font-family:'Montserrat',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="danang"
                  className="[font-family:'Montserrat',Helvetica] font-medium text-black text-base"
                >
                  Đà Nẵng
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="opacity-60 [font-family:'Montserrat',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              Quận / Huyện
            </label>

            <Select defaultValue="nguhanh">
              <SelectTrigger className="w-full h-[50px] bg-white rounded-lg border border-solid border-[#00000036] px-2.5 py-[15px]">
                <SelectValue className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="nguhanh"
                  className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base"
                >
                  Quận Ngũ Hành Sơn
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full">
          <SearchIcon className="absolute left-[15px] top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
          <Input
            defaultValue="Vinschool"
            className="h-[50px] w-full bg-[#f5f5fa] rounded-[10px] border border-solid border-[#999999] pl-[51px] pr-[15px] py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-[normal]"
          />
        </div>

        <div className="flex flex-col items-start gap-[15px] w-full">
          {schoolData.map((school) => (
            <button
              key={school.id}
              className={`flex w-full h-[87px] items-start justify-between p-2.5 rounded-[10px] border-2 border-solid transition-colors ${
                school.selected
                  ? "bg-[#dadae24a] border-[#2858e9]"
                  : "border-[#cac9d6] hover:border-[#2858e9]"
              }`}
            >
              <div className="flex items-start gap-[14px]">
                <img
                  className="w-[67px] h-[67px] rounded-[10px] border border-solid border-black object-cover"
                  alt={school.name}
                  src={school.image}
                />

                <div className="flex flex-col gap-0.5 pt-3">
                  <h3 className="text-left [font-family:'Montserrat',Helvetica] font-bold text-black text-xl tracking-[0] leading-[normal]">
                    {school.name}
                  </h3>

                  <p className="text-left opacity-40 [font-family:'Montserrat',Helvetica] font-semibold text-black text-sm tracking-[0] leading-[normal]">
                    {school.address}
                  </p>
                </div>
              </div>

              {school.selected && (
                <CheckCircle2Icon className="w-5 h-5 text-[#2858e9] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
