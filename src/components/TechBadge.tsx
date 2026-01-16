import React from 'react';

interface TechBadgeProps {
  name: string;
}

// Map of technology names to their logo URLs (using simple-icons via CDN)
const techLogos: Record<string, string> = {
  // Languages
  'Python': 'https://cdn.simpleicons.org/python',
  'TypeScript': 'https://cdn.simpleicons.org/typescript',

  // Frameworks & Libraries
  'FastAPI': 'https://cdn.simpleicons.org/fastapi',
  'Next.js': 'https://cdn.simpleicons.org/nextdotjs/000000',
  'Tailwind': 'https://cdn.simpleicons.org/tailwindcss',
  'Pydantic': 'https://cdn.simpleicons.org/pydantic',
  'React Query': 'https://cdn.simpleicons.org/reactquery',

  // Databases & Storage
  'Redis': 'https://cdn.simpleicons.org/redis',
  'PostgreSQL': 'https://cdn.simpleicons.org/postgresql',
  'LanceDB': 'https://cdn.simpleicons.org/databricks', // Using similar icon
  'Qdrant': 'https://cdn.simpleicons.org/qwik', // Using similar icon

  // AI & ML
  'Gemini': 'https://cdn.simpleicons.org/googlegemini',
  'XGBoost': 'https://cdn.simpleicons.org/xstate', // Using similar icon
  'MediaPipe': 'https://cdn.simpleicons.org/google',
  'SHAP': 'https://cdn.simpleicons.org/plotly',

  // DevOps & Infrastructure
  'Vercel': 'https://cdn.simpleicons.org/vercel/000000',
  'Render': 'https://cdn.simpleicons.org/render',
  'Airflow': 'https://cdn.simpleicons.org/apacheairflow',
  'Temporal': 'https://cdn.simpleicons.org/temporal',

  // Tools & Services
  'GrowthBook': 'https://cdn.simpleicons.org/growthbook',
  'Tavily': 'https://cdn.simpleicons.org/googlesearchconsole',
  'LangGraph': 'https://cdn.simpleicons.org/langchain',
};

// Fallback colors for badges without logos
const techColors: Record<string, string> = {
  'BGE-M3': '#4A90A4',
  'Semantic Router': '#6B4C9A',
  'Unstructured.io': '#E6526F',
  'faster-whisper': '#34A853',
  'Presidio': '#0078D4',
  'GLiNER': '#FF6B6B',
};

const TechBadge: React.FC<TechBadgeProps> = ({ name }) => {
  const logoUrl = techLogos[name];
  const fallbackColor = techColors[name] || '#6C757D';

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg text-sm text-[#212529] transition-colors">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-4 h-4 object-contain"
          loading="lazy"
          onError={(e) => {
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: fallbackColor }}
        />
      )}
      <span>{name}</span>
    </span>
  );
};

export default TechBadge;
