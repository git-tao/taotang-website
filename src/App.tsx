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
import BookingSuccess from './pages/BookingSuccess';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import IntakeModal from './components/IntakeModal';
import { ModalProvider } from './context/ModalContext';
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
      <IntakeModal />
    </div>
  );
};

// Wrapper component that provides modal context to case study pages
const CaseStudyPageWrapper: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <CaseStudyPage />
      </main>
      <Footer />
      <IntakeModal />
    </div>
  );
};

// Wrapper for NotFound page
const NotFoundWrapper: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <NotFound />
      </main>
      <Footer />
      <IntakeModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ModalProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/case-study/:slug" element={<CaseStudyPageWrapper />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="*" element={<NotFoundWrapper />} />
        </Routes>
      </ModalProvider>
    </BrowserRouter>
  );
};

export default App;
