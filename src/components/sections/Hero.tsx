import React from 'react';
import { useModal } from '../../context/ModalContext';

const Hero: React.FC = () => {
  const { openModal } = useModal();

  const handleViewServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-28 px-6 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl text-[#212529] leading-[1.05] mb-6 font-bold animate-hero">
          I audit, stabilize, and ship production AI systems.
        </h1>
        <p className="text-lg md:text-xl text-[#6C757D] mb-10 max-w-2xl mx-auto leading-relaxed animate-hero animate-hero-delay-1">
          Hands-on, project-based work for engineering and product leaders who need to unblock delivery, audit complex systems, or move from prototype to production.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-hero animate-hero-delay-2">
          <a
            href="#services"
            onClick={handleViewServices}
            className="btn-primary inline-block px-10 py-4 rounded-md"
          >
            View Services
          </a>
          <button
            onClick={openModal}
            className="px-10 py-4 rounded-md border-2 border-[#212529] text-[#212529] font-bold hover:bg-[#212529] hover:text-white transition-all"
          >
            Free Discovery Call
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
