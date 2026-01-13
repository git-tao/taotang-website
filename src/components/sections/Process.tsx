import React from 'react';

const Process: React.FC = () => {
  return (
    <section id="how-i-work" className="section-padding px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-12">How I Work</h2>
        <div className="max-w-3xl">
          <p className="text-gray-600 mb-10 text-xl font-light">
            Whether you're exploring feasibility or stabilizing production, I help leaders at any stage. I work with both technical and non-technical decision makers.
          </p>
          <ul className="space-y-8">
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">Fixed Scope, Fixed Price</span>
              <p className="text-gray-600 text-sm">All projects are defined with clear deliverables and a fixed price. No open-ended retainers or hourly billing.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">Async-First</span>
              <p className="text-gray-600 text-sm">We'll use a shared Slack channel and a project management tool. Meetings are rare and only for high-bandwidth decisions.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">From Validation to Production</span>
              <p className="text-gray-600 text-sm">I help at any stage: validating AI concepts, auditing existing systems, recommending tech stacks, or shipping production code.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">Hands-On Individual Contributor</span>
              <p className="text-gray-600 text-sm">I build, audit, and stabilize systems directly. I don't manage internal teams or engage in consulting theater.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Process;
