import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-24 px-6 bg-[#212529] text-[#F8F9FA]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-[#F8F9FA]">Tao Tang</span>
          <span className="text-[11px] text-[#6C757D] uppercase tracking-[0.3em] font-bold">&copy; 2026 — AI Systems Engineer</span>
        </div>
        <div className="flex gap-16 text-sm font-semibold">
          <a href="https://linkedin.com/in/taotang15" target="_blank" rel="noopener noreferrer" className="text-[#FFBF00] hover:text-[#E6AC00] transition-colors">LinkedIn</a>
          <a href="https://github.com/git-tao" target="_blank" rel="noopener noreferrer" className="text-[#FFBF00] hover:text-[#E6AC00] transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;