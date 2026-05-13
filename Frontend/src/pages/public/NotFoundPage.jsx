import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-earth-100 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-leaf-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-forest-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="text-8xl mb-4" aria-hidden="true">🌿</div>
        <h1 className="text-7xl font-extrabold text-forest-900 mb-3 tracking-tight">404</h1>
        <p className="text-2xl font-semibold text-bark-800 mb-2">This trail leads nowhere</p>
        <p className="text-bark-500 mb-8 max-w-md mx-auto leading-relaxed">
          The page you're looking for has either moved, been removed, or never existed in our forest. 🌲
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center gap-2 bg-forest-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-forest-800 transition-colors shadow-lg shadow-forest-600/20">
            <Home size={18} /> Back to Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white text-bark-800 font-semibold px-6 py-3 rounded-xl hover:bg-leaf-200/60 transition-colors border border-leaf-200"
          >
            <ArrowLeft size={18} /> Go back
          </button>
        </div>
      </div>
    </div>
  );
}
