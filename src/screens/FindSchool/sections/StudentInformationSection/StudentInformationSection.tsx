import {
  ArrowRightIcon,
  CheckCircle2Icon,
  RulerIcon,
  UserPlusIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../../components/ui/radio-group";

export const StudentInformationSection = (): JSX.Element => {
  const formFields = [
    {
      label: "Họ và tên học sinh",
      value: "Võ Gia Truyền",
      fullWidth: true,
    },
  ];

  const twoColumnFields = [
    { label: "Khối", value: "Khối 5" },
    { label: "Lớp", value: "5A1" },
  ];

  const measurementFields = [
    { label: "Chiều cao (cm)", value: "200" },
    { label: "Cân nặng (kg)", value: "100" },
  ];

  return (
    <section className="w-full max-w-[30rem] flex flex-col bg-white rounded-[1.875rem] shadow-[0px_0px_4px_#00000040] p-6 lg:p-8 translate-y-[-1rem] animate-fade-in opacity-0">
      <header className="flex items-center justify-center gap-3 lg:gap-5 mb-6 lg:mb-[2.2rem]">
        <div className="flex items-center justify-center gap-2.5 p-[5px] bg-[#4182f933] rounded-[50px] overflow-hidden">
          <div className="flex items-center justify-center w-6 text-[#4182f9] text-xl text-center [font-family:'Montserrat',Helvetica] font-bold tracking-[0] leading-[normal]">
            2
          </div>
        </div>

        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl lg:text-[2rem] text-center tracking-[0] leading-[normal]">
          Thông tin học sinh
        </h2>
      </header>

      <Alert className="mb-[35px] bg-[#5ec26921] border-[#5ec269] rounded-[10px] p-2.5 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <CheckCircle2Icon className="h-6 w-6 text-[#5ec269]" />
        <AlertDescription className="ml-2.5">
          <div className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal] mb-1.5">
            Đã tìm thấy hồ sơ!
          </div>
          <div className="opacity-60 [font-family:'Montserrat',Helvetica] font-medium text-black text-[13px] tracking-[0] leading-[normal]">
            Thông tin được điền tự động từ số điện thoại 098*****635. Vui lòng
            kiểm tra kỹ.
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-5 mb-10 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        {formFields.map((field, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm tracking-[0] leading-[normal]">
              {field.label}
            </Label>
            <Input
              defaultValue={field.value}
              className="h-[50px] px-2.5 py-[15px] bg-white rounded-[10px] border border-solid border-[#00000036] [font-family:'Montserrat',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal]"
            />
          </div>
        ))}

        <div className="flex gap-[13px]">
          {twoColumnFields.map((field, index) => (
            <div key={index} className="flex-1 flex flex-col gap-2.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm tracking-[0] leading-[normal]">
                {field.label}
              </Label>
              <Input
                defaultValue={field.value}
                className="h-[50px] px-[15px] py-[15px] bg-white rounded-[10px] border border-solid border-[#00000036] [font-family:'Montserrat',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal]"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm tracking-[0] leading-[normal]">
            Giới tính
          </Label>
          <RadioGroup defaultValue="female" className="flex gap-[23px]">
            <div className="flex-1 flex items-center justify-center gap-2.5 h-[50px] px-[15px] py-[15px] bg-white rounded-[10px] border border-solid border-[#00000036] cursor-pointer transition-colors hover:bg-gray-50">
              <RadioGroupItem value="male" id="male" className="w-6 h-6" />
              <Label
                htmlFor="male"
                className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal] cursor-pointer"
              >
                Nam
              </Label>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2.5 h-[50px] px-[15px] py-[15px] bg-[#4182f91c] rounded-[10px] border border-solid border-[#4182f9] cursor-pointer">
              <RadioGroupItem value="female" id="female" className="w-6 h-6" />
              <Label
                htmlFor="female"
                className="[font-family:'Montserrat',Helvetica] font-bold text-[#4182f9] text-base tracking-[0] leading-[normal] cursor-pointer"
              >
                Nữ
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <img
        className="w-full h-px object-cover mb-[17px]"
        alt="Line"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/line-19.svg"
      />

      <div className="flex items-center gap-3.5 mb-[17px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <RulerIcon className="w-8 h-6 text-[#045dff]" />
        <h3 className="[text-shadow:0px_0px_2px_#00000040] [font-family:'Montserrat',Helvetica] font-bold text-[#045dff] text-sm tracking-[0] leading-[normal]">
          SỐ ĐO (CHO THỬ ĐỒ ẢO)
        </h3>
      </div>

      <div className="flex gap-[21px] mb-[29px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
        {measurementFields.map((field, index) => (
          <div key={index} className="flex-1 flex flex-col gap-2.5">
            <Label className="opacity-40 [font-family:'Montserrat',Helvetica] font-semibold text-black text-sm tracking-[0] leading-[normal]">
              {field.label}
            </Label>
            <Input
              defaultValue={field.value}
              className="h-[50px] px-[15px] py-[15px] bg-white rounded-[10px] border border-solid border-[#00000036] [font-family:'Montserrat',Helvetica] font-bold text-black text-base tracking-[0] leading-[normal]"
            />
          </div>
        ))}
      </div>

      <Button className="h-[63px] px-[15px] py-2.5 bg-[#3c6efd] rounded-[10px] shadow-[0px_0px_8.4px_#3c6efd] [font-family:'Montserrat',Helvetica] font-bold text-white text-xl tracking-[0] leading-[normal] mb-[17px] hover:bg-[#2d5ee6] transition-colors translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms]">
        Xác nhận &amp; Mua sắm
        <ArrowRightIcon className="w-6 h-6 ml-2.5" />
      </Button>

      <button className="flex items-center justify-center gap-2.5 mx-auto hover:opacity-70 transition-opacity translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1200ms]">
        <UserPlusIcon className="w-[30px] h-[30px] text-black opacity-50" />
        <span className="opacity-50 [font-family:'Montserrat',Helvetica] font-bold text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
          Thêm học sinh khác
        </span>
      </button>
    </section>
  );
};
