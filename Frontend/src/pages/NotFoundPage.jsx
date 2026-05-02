import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-earth-100 flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 bg-forest-600 rounded-2xl flex items-center justify-center mb-6">
        <Leaf size={32} className="text-white" />
      </div>
      <h1 className="text-6xl font-extrabold text-forest-900 mb-3">404</h1>
      <p className="text-xl font-semibold text-bark-800 mb-2">Page not found</p>
      <p className="text-bark-400 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-forest-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-forest-700 transition-colors">
        Back to Home
      </Link>
    </div>
  );
}

