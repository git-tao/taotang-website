import React from 'react';
import { useModal } from '../../context/ModalContext';

const FinalCTA: React.FC = () => {
  const { openModal } = useModal();

  const handleStartProject = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal();
  };

  return (
    <section className="section-padding px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-[#212529] mb-8 leading-tight">Ready to Begin?</h2>
        <p className="text-xl text-[#212529] mb-12 font-light">Let's solve a concrete problem.</p>
        <button
          onClick={handleStartProject}
          className="inline-block px-12 py-5 bg-[#FFBF00] text-[#212529] font-bold rounded-md hover:bg-[#E6AC00] transition-all shadow-xl shadow-amber-100/50 transform hover:-translate-y-1"
        >
          Start a Project Inquiry
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
