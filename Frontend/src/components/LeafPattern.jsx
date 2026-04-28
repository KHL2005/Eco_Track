export default function LeafPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="leaves" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 10 C40 10 50 25 40 40 C30 25 40 10 40 10Z" fill="#2D6A4F"/>
          <path d="M10 50 C10 50 20 65 10 80 C0 65 10 50 10 50Z" fill="#2D6A4F"/>
          <path d="M70 50 C70 50 80 65 70 80 C60 65 70 50 70 50Z" fill="#2D6A4F"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#leaves)"/>
    </svg>
  );
}

