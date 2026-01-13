import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseStudies } from '../data/caseStudies';
import NotFound from './NotFound';

const CaseStudyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const study = caseStudies.find(s => s.slug === slug);

  // Update document title and meta description (UX only, not crawler SEO)
  useEffect(() => {
    if (study) {
      // Capture original values before modifying
      const originalTitle = document.title;
      const metaDescription = document.querySelector('meta[name="description"]');
      const originalDescription = metaDescription?.getAttribute('content') || '';

      // Update title
      document.title = `${study.title} - Case Study | Tao Tang`;

      // Update meta description
      if (metaDescription) {
        metaDescription.setAttribute('content', study.summary);
      }

      // Cleanup: restore original values on unmount
      return () => {
        document.title = originalTitle;
        if (metaDescription) {
          metaDescription.setAttribute('content', originalDescription);
        }
      };
    }
  }, [study]);

  if (!study) {
    return <NotFound />;
  }

  // Handle back navigation with location state (HomePage handles the scroll)
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/', { state: { scrollTo: 'case-studies' } });
  };

  return (
    <article className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb for SEO */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <a
            href="/#case-studies"
            onClick={handleBackClick}
            className="text-sm text-[#6C757D] hover:text-[#FFBF00] transition-colors"
          >
            ← Back to Case Studies
          </a>
        </nav>

        <header className="mb-12">
          <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest">
            {study.category}
          </span>
          <h1 className="text-4xl font-bold text-[#212529] mt-2 mb-4">
            {study.title}
          </h1>
          <p className="text-xl text-[#6C757D]">{study.summary}</p>
        </header>

        {/* Metrics Grid */}
        {study.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {study.metrics.map(m => (
              <div key={m.label} className="bg-[#F8F9FA] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#212529]">{m.value}</div>
                <div className="text-xs text-[#6C757D] uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">The Challenge</h2>
          <p className="text-[#212529] leading-relaxed">{study.challenge}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">The Solution</h2>
          <p className="text-[#212529] leading-relaxed">{study.solution}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">Results</h2>
          <ul className="space-y-2">
            {study.results.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFBF00] mt-2" />
                <span className="text-[#212529]">{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#212529] mb-4">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {study.technologies.map(t => (
              <span key={t} className="px-3 py-1 bg-[#F8F9FA] rounded-full text-sm text-[#212529]">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
};

export default CaseStudyPage;
