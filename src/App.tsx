import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import AboutSnippet from './components/sections/AboutSnippet';
import CaseStudies from './components/sections/CaseStudies';
import Process from './components/sections/Process';
import FinalCTA from './components/sections/FinalCTA';
import InitiateProject from './components/intake/InitiateProject';

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
        <InitiateProject />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;