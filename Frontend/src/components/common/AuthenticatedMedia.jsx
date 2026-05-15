import { useState, useEffect } from 'react';

function getToken() {
  try {
    const stored = localStorage.getItem('ecotrack_auth');
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
}

async function fetchAuthBlob(url) {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function AuthenticatedImage({ src, alt = '', className = '', onClick }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    let objectUrl = null;
    setLoading(true);
    setError(false);
    setBlobUrl(null);

    fetchAuthBlob(src)
      .then(url => { objectUrl = url; setBlobUrl(url); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  if (loading) {
    return <div className="w-full h-full bg-earth-100 animate-pulse rounded-xl" />;
  }
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-bark-400 text-xs bg-earth-100 rounded-xl gap-1">
        ⚠ Failed to load image
      </div>
    );
  }
  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onClick={() => onClick?.(blobUrl)}
    />
  );
}

export function AuthenticatedVideo({ src, className = '' }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    let objectUrl = null;
    setLoading(true);
    setError(false);
    setBlobUrl(null);

    fetchAuthBlob(src)
      .then(url => { objectUrl = url; setBlobUrl(url); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  if (loading) {
    return (
      <div className="w-full h-40 bg-earth-200 animate-pulse rounded-xl flex items-center justify-center text-bark-400 text-xs">
        Loading video…
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-40 bg-earth-100 rounded-xl flex items-center justify-center text-bark-400 text-xs gap-1">
        ⚠ Failed to load video
      </div>
    );
  }
  return (
    <video
      src={blobUrl}
      controls
      className={className}
      preload="metadata"
    />
  );
}
