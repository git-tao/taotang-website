import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import AboutSnippet from './components/sections/AboutSnippet';
import CaseStudies from './components/sections/CaseStudies';
import Process from './components/sections/Process';
import FinalCTA from './components/sections/FinalCTA';
import { IntakeWizard } from './components/intake';
import CaseStudyPage from './pages/CaseStudyPage';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import { useGlobalScrollAnimation } from './hooks/useGlobalScrollAnimation';

// HomePage component wraps existing sections and preserves semantics
const HomePage: React.FC = () => {
  const location = useLocation();

  // Re-run animation observer on mount (handles returning from case study)
  useGlobalScrollAnimation();

  // Handle scroll-to from location state (e.g., back from case study)
  useEffect(() => {
    if (location.state?.scrollTo) {
      // Small delay to ensure DOM is ready after route transition
      requestAnimationFrame(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
      // Clear the state to prevent re-scrolling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/case-study/:slug" element={<CaseStudyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
