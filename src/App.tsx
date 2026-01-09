import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import AboutSnippet from './components/sections/AboutSnippet';
import CaseStudies from './components/sections/CaseStudies';
import Process from './components/sections/Process';
import FinalCTA from './components/sections/FinalCTA';
import { IntakeWizard } from './components/intake';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Services />
        <AboutSnippet />
        <CaseStudies />
        <Process />
        <IntakeWizard />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;