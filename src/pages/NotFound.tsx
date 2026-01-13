import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  // Set 404-specific title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '404 - Page Not Found | Tao Tang';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#212529] mb-4">404</h1>
        <p className="text-xl text-[#6C757D] mb-8">Page not found</p>
        <Link
          to="/"
          className="btn-primary inline-block px-8 py-3 rounded-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
