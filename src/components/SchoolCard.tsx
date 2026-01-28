import { MapPin, ArrowRight } from "lucide-react";

interface SchoolCardProps {
  name: string;
  address: string;
  imageUrl: string;
  hasUniform?: boolean;
}

export default function SchoolCard({ name, address, imageUrl, hasUniform = true }: SchoolCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group flex flex-col h-full">
      {/* Image - always square */}
      <div className="relative w-full aspect-square overflow-hidden flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 lg:p-5 flex flex-col flex-1">
        {/* School Name */}
        <h3 className="font-montserrat font-extrabold text-2xl text-black mb-3">
          {name}
        </h3>

        {/* Address - Fixed height to prevent misalignment */}
        <div className="flex items-start gap-2.5 mb-6 min-h-[48px]">
          <MapPin className="w-7 h-7 flex-shrink-0 mt-0.5" />
          <p className="font-montserrat font-medium text-[15px] text-black line-clamp-2">
            {address}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-vtos-gray-border mb-4"></div>

        {/* Footer - Always at bottom */}
        <div className="flex items-center justify-between mt-auto">
          {hasUniform && (
            <div className="inline-flex items-center gap-2.5 bg-vtos-light-green rounded-lg px-2.5 py-1.5">
              <span className="font-montserrat font-semibold text-[15px] text-vtos-green whitespace-nowrap">
                Có sẵn đồng phục
              </span>
            </div>
          )}
          
          <button 
            className="ml-auto hover:scale-110 transition-transform"
            aria-label="View school details"
          >
            <ArrowRight className="w-7 h-7 text-vtos-blue" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { SchoolCard };
