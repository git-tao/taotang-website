import React from 'react';

const Process: React.FC = () => {
  return (
    <section id="how-i-work" className="section-padding px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-12">How I Work</h2>
        <div className="max-w-3xl">
          <p className="text-gray-600 mb-10 text-xl font-light">
            I work best with teams who are ready to execute. My process is designed for speed and clarity, with a strong preference for asynchronous communication.
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
              <span className="font-semibold text-gray-900">Direct Access Required</span>
              <p className="text-gray-600 text-sm">To be effective, I require access to your code repository, cloud environment, or a dedicated sandbox.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900">No People Management</span>
              <p className="text-gray-600 text-sm">My role is to be a senior, hands-on individual contributor. I do not manage internal teams or staff.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Process;