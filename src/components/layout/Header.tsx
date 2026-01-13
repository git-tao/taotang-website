import React from 'react';
import { useModal } from '../../context/ModalContext';

const Header: React.FC = () => {
  const { openModal } = useModal();

  const handleStartProject = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight text-[#212529]">
          Tao Tang
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <a href="#services" className="text-sm font-medium text-[#212529] hover:text-[#FFBF00] transition-colors">Services</a>
          <a href="#case-studies" className="text-sm font-medium text-[#212529] hover:text-[#FFBF00] transition-colors">Case Studies</a>
          <a href="#how-i-work" className="text-sm font-medium text-[#212529] hover:text-[#FFBF00] transition-colors">How I Work</a>
          <button
            onClick={handleStartProject}
            className="px-5 py-2.5 bg-[#FFBF00] text-[#212529] text-sm font-semibold rounded-md hover:bg-[#E6AC00] transition-all shadow-sm"
          >
            Start a Project
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
