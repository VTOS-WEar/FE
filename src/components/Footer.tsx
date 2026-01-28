import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#DFCFFF] to-[#3C6EFD] overflow-hidden">
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-12">
          {/* Contact Info - Left */}
          <div className="text-left">
            <p className="font-roboto text-base text-black mb-6">Liên hệ</p>
            <p className="font-montserrat text-xl font-bold text-black mb-4">support@xxx.com</p>
            <p className="font-montserrat text-xl font-bold text-black">+62821-5949-5854</p>
          </div>

          {/* Center Section */}
          <div className="flex-1 max-w-2xl mx-auto text-center">
            <h3 className="font-montserrat text-2xl md:text-3xl font-bold text-black mb-8 leading-normal">
              Nền tảng thử đồng phục trực tuyến bằng AI dành cho học sinh, phụ huynh và trường học.
            </h3>

            {/* CTA Button */}
            <button className="inline-flex items-center justify-center gap-16 px-16 py-2.5 bg-[#0E00DD] rounded-[61px] hover:bg-[#0E00DD]/90 transition-colors mb-8">
              <span className="font-roboto text-lg text-white uppercase">Thử ngay</span>
              <svg className="w-3 h-2.5 rotate-90 fill-white" viewBox="0 0 12 10">
                <path d="M6 10L0 0H12L6 10Z" />
              </svg>
            </button>

            {/* Email Subscription */}
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-between gap-1 p-1 bg-[#0E00DD] rounded-full border border-white/20 mb-3">
                <div className="flex items-center gap-1 px-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.5 6C8.189 6 5.5 8.689 5.5 12C5.5 15.311 8.189 18 11.5 18C14.811 18 17.5 15.311 17.5 12C17.5 8.689 14.811 6 11.5 6ZM11.5 8C13.708 8 15.5 9.792 15.5 12C15.5 14.208 13.708 16 11.5 16C9.292 16 7.5 14.208 7.5 12C7.5 9.792 9.292 8 11.5 8Z" fill="white"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M19.25 17L19.343 16.999C20.304 16.975 21.22 16.583 21.902 15.902C22.605 15.198 23 14.245 23 13.25V11C23 5.52 18.592 1.07 13.129 1.001L13 1H12C5.929 1 1 5.929 1 12C1 18.071 5.929 23 12 23C12.552 23 13 22.552 13 22C13 21.448 12.552 21 12 21C7.033 21 3 16.967 3 12C3 7.033 7.033 3 12 3H13C17.418 3 21 6.582 21 11V13.25C21 13.714 20.816 14.159 20.487 14.487C20.159 14.816 19.714 15 19.25 15M19.25 15C18.786 15 18.341 14.816 18.013 14.487C17.684 14.159 17.5 13.714 17.5 13.25V8C17.5 7.465 17.08 7.028 16.551 7.001L16.5 7C15.948 7 15.5 7.448 15.5 8C15.5 8 15.5 10.935 15.5 13.25C15.5 14.245 15.895 15.198 16.598 15.902C17.302 16.605 18.255 17 19.25 17" fill="white"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="bg-transparent border-none outline-none text-white placeholder:text-white font-montserrat text-sm font-medium w-full"
                  />
                </div>
                <button className="px-6 py-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                  <span className="font-montserrat text-sm font-semibold text-[#3A3A3A]">Gửi ngay</span>
                </button>
              </div>
              <p className="font-montserrat text-sm text-black leading-[150%]">
                Cập nhật những thông tin, hiểu biết và sự kiện mới nhất từ ​​VTOS.
              </p>
            </div>
          </div>

          {/* Address - Right */}
          <div className="text-left">
            <p className="font-roboto text-base text-black mb-6">Địa chỉ</p>
            <p className="font-montserrat text-xl font-bold text-black">Đà Nẵng</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-black/10">
          <p className="font-roboto text-sm text-black">
            © Copyright 2025. All rights reserved.
          </p>
          <p className="font-roboto text-sm text-black">
            Terms & Conditions
          </p>
          <div className="flex items-center gap-3">
            {/* Zalo */}
            <button className="w-6 h-6 hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.49 10.272V9.82198H13.837V16.144H13.067C12.9146 16.1442 12.7683 16.0841 12.6601 15.9767C12.552 15.8693 12.4908 15.7234 12.49 15.571C11.9278 15.9828 11.2488 16.2052 10.552 16.204C9.68138 16.204 8.84638 15.8583 8.23057 15.2428C7.61476 14.6274 7.26853 13.7926 7.268 12.922C7.26853 12.0514 7.61476 11.2166 8.23057 10.6011C8.84638 9.9857 9.68138 9.63998 10.552 9.63998C11.2485 9.63898 11.9281 9.8604 12.49 10.272ZM6.919 7.78998V7.99498C6.919 8.37698 6.868 8.68898 6.619 9.05498L6.589 9.08898C6.50612 9.18208 6.42544 9.27711 6.347 9.37398L2.024 14.8H6.919V15.568C6.919 15.6437 6.90407 15.7187 6.87506 15.7886C6.84605 15.8586 6.80353 15.9221 6.74994 15.9756C6.69635 16.0291 6.63273 16.0715 6.56273 16.1004C6.49273 16.1293 6.41773 16.1441 6.342 16.144H0V15.782C0 15.339 0.11 15.141 0.25 14.935L4.858 9.22998H0.192V7.78998H6.919ZM15.47 16.144C15.3427 16.144 15.2206 16.0934 15.1306 16.0034C15.0406 15.9134 14.99 15.7913 14.99 15.664V7.78998H16.431V16.144H15.47ZM20.693 9.59998C21.1272 9.59985 21.5571 9.68523 21.9582 9.85125C22.3594 10.0173 22.7239 10.2607 23.031 10.5676C23.3381 10.8745 23.5817 11.2389 23.748 11.6399C23.9142 12.041 23.9999 12.4708 24 12.905C24.0001 13.3391 23.9147 13.7691 23.7487 14.1702C23.5827 14.5714 23.3393 14.9359 23.0324 15.243C22.7255 15.55 22.3611 15.7937 21.9601 15.9599C21.559 16.1262 21.1292 16.2118 20.695 16.212C19.8182 16.2122 18.9772 15.8642 18.357 15.2444C17.7368 14.6246 17.3883 13.7838 17.388 12.907C17.3877 12.0302 17.7358 11.1892 18.3556 10.569C18.9754 9.94881 19.8162 9.60024 20.693 9.59998ZM10.553 14.853C10.8103 14.8588 11.0663 14.8132 11.3057 14.7188C11.5452 14.6243 11.7634 14.483 11.9475 14.3031C12.1315 14.1231 12.2778 13.9082 12.3777 13.671C12.4775 13.4337 12.529 13.1789 12.529 12.9215C12.529 12.6641 12.4775 12.4092 12.3777 12.172C12.2778 11.9347 12.1315 11.7198 11.9475 11.5399C11.7634 11.36 11.5452 11.2186 11.3057 11.1242C11.0663 11.0298 10.8103 10.9841 10.553 10.99C10.0483 11.0015 9.56822 11.21 9.21537 11.571C8.86251 11.932 8.66495 12.4167 8.66495 12.9215C8.66495 13.4263 8.86251 13.911 9.21537 14.272C9.56822 14.633 10.0483 14.8415 10.553 14.853ZM20.693 14.85C21.2088 14.85 21.7036 14.6451 22.0683 14.2803C22.4331 13.9155 22.638 13.4208 22.638 12.905C22.638 12.3891 22.4331 11.8944 22.0683 11.5297C21.7036 11.1649 21.2088 10.96 20.693 10.96C20.1772 10.96 19.6824 11.1649 19.3177 11.5297C18.9529 11.8944 18.748 12.3891 18.748 12.905C18.748 13.4208 18.9529 13.9155 19.3177 14.2803C19.6824 14.6451 20.1772 14.85 20.693 14.85Z" fill="black"/>
              </svg>
            </button>
            {/* Facebook */}
            <button className="w-5 h-5 hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 14.84 3.44 18.87 8 19.8V13H6V10H8V7.5C8 5.57 9.57 4 11.5 4H14V7H12C11.45 7 11 7.45 11 8V10H14V13H11V19.95C16.05 19.45 20 15.19 20 10Z" fill="black"/>
              </svg>
            </button>
            {/* YouTube */}
            <button className="w-6 h-6 hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.532 5.207C8.30333 5.069 10.459 5 11.999 5C13.539 5 15.6955 5.06917 18.4685 5.2075C19.1941 5.24372 19.882 5.54203 20.4043 6.04706C20.9266 6.55208 21.2479 7.22949 21.3085 7.9535C21.4355 9.47017 21.499 10.8063 21.499 11.962C21.499 13.1313 21.434 14.486 21.304 16.026C21.2436 16.7417 20.9285 17.412 20.4159 17.9151C19.9033 18.4181 19.2272 18.7206 18.5105 18.7675C16.1402 18.9225 13.9697 19 11.999 19C10.029 19 7.85933 18.9225 5.49 18.7675C4.77354 18.7206 4.09763 18.4184 3.58505 17.9156C3.07247 17.4129 2.7572 16.7429 2.6965 16.0275C2.56483 14.4758 2.499 13.1207 2.499 11.962C2.499 10.817 2.56317 9.48033 2.6915 7.952C2.75234 7.22817 3.07373 6.551 3.59602 6.04618C4.11831 5.54136 4.80602 5.24319 5.5315 5.207H5.532Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M10.5 9.805V14.203C10.5 14.2805 10.5209 14.3565 10.5607 14.423C10.6004 14.4894 10.6574 14.5439 10.7256 14.5806C10.7938 14.6173 10.8707 14.6348 10.9481 14.6312C11.0254 14.6277 11.1004 14.6033 11.165 14.5605L14.4635 12.3805C14.5225 12.3416 14.5709 12.2888 14.6045 12.2267C14.6381 12.2646 14.6558 12.0952 14.6561 12.0246C14.6564 11.9539 14.6393 11.8844 14.6062 11.822C14.5731 11.7596 14.5251 11.7064 14.4665 11.667L11.1675 9.449C11.103 9.40568 11.028 9.38069 10.9504 9.37672C10.8728 9.37275 10.7956 9.38994 10.7271 9.42645C10.6585 9.46297 10.6012 9.51743 10.5612 9.58402C10.5212 9.65061 10.5 9.72682 10.5 9.8045V9.805Z" fill="white" stroke="white" strokeWidth="1.7145" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Large VTOS Text */}
        <div className="text-center mt-8">
          <h2 className="font-montserrat text-[120px] md:text-[180px] lg:text-[230px] font-bold text-black leading-none">
            VTOS
          </h2>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
