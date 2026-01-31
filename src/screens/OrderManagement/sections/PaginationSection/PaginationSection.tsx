import { Button } from "../../../../components/ui/button";

const pageNumbers = [
  { number: 1, isActive: true },
  { number: 2, isActive: false },
  { number: 3, isActive: false },
];

export const PaginationSection = (): JSX.Element => {
  return (
    <section className="w-full flex items-center justify-between bg-white rounded-[10px] shadow-[0px_0px_4px_#0000006b] px-[35px] py-8">
      <p className="[font-family:'Montserrat',Helvetica] font-normal text-black text-xl tracking-[0] leading-normal whitespace-nowrap">
        Hiển thị 1 đến 4 của 10 kết quả
      </p>

      <nav className="flex items-center gap-0" aria-label="Pagination">
        <Button
          variant="ghost"
          size="icon"
          className="h-[60px] w-[42px] rounded-none p-0 hover:bg-transparent"
          aria-label="Previous page"
        >
          <img
            className="w-[42px] h-[60px]"
            alt="Previous"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/button-7.svg"
          />
        </Button>

        {pageNumbers.map((page) => (
          <Button
            key={page.number}
            variant="ghost"
            className={`h-[60px] w-[60px] rounded-none p-[15px] hover:bg-transparent border-2 border-solid ${
              page.isActive ? "border-[#3c6efd]" : "border-[#999999]"
            }`}
            aria-label={`Page ${page.number}`}
            aria-current={page.isActive ? "page" : undefined}
          >
            <span
              className={`font-medium text-center [font-family:'Montserrat',Helvetica] text-2xl tracking-[0] leading-normal ${
                page.isActive ? "text-[#3c6efd]" : "text-[#999999]"
              }`}
            >
              {page.number}
            </span>
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-[60px] w-[42px] rounded-none p-0 hover:bg-transparent"
          aria-label="Next page"
        >
          <img
            className="w-[42px] h-[60px]"
            alt="Next"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/button-6.svg"
          />
        </Button>
      </nav>
    </section>
  );
};
