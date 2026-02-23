import { Card, CardContent } from "../../../components/ui/card";

const instructionSteps = [
    {
        icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239530.svg",
        title: "Tải mẫu chuẩn",
        description: "Tải file mẫu Excel (.xlsx) chuẩn định dạng của hệ thống.",
    },
    {
        icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239530-2.svg",
        title: "Điền thông tin",
        description: "Nhập dữ liệu vào file mẫu. Không thay đổi tiêu đề cột.",
    },
    {
        icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239530-1.svg",
        title: "Tải lên hệ thống",
        description: "Kéo thả file đã điền đầy đủ thông tin để nhập liệu.",
    },
];

export const ImportInstructionsSection = (): JSX.Element => {
    return (
        <section className="w-full flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-[30px] px-0 sm:px-4">
            {instructionSteps.map((step, index) => (
                <Card
                    key={index}
                    className="w-full sm:max-w-[300px] min-h-[160px] sm:h-[184px] bg-white rounded-[10px] overflow-hidden shadow-[0px_0px_4px_#00000040]"
                >
                    <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                        <img
                            className="w-9 h-9 sm:w-11 sm:h-11 mb-2 sm:mb-3"
                            alt={`Step ${index + 1} icon`}
                            src={step.icon}
                        />

                        <h3 className="w-full flex items-center justify-center [font-family:'Montserrat',Helvetica] font-bold text-black text-lg sm:text-xl tracking-[0] leading-[normal] mb-2">
                            {step.title}
                        </h3>

                        <p className="w-full text-[#677489] text-sm sm:text-base flex items-center justify-center [font-family:'Montserrat',Helvetica] font-medium tracking-[0] leading-[normal] text-center">
                            {step.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
};
