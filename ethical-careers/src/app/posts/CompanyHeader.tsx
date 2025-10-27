
// app/posts/CompanyHeader.tsx
"use client";

export default function CompanyHeader({
  name,
  rating,
}: {
  name: string;
  rating: number;
}) {
  return (
    <section
      id="company"
      className="border border-gray-200 bg-white/70 backdrop-blur rounded-2xl p-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-[#44AF69]" />
          <div>
            <div className="text-xs text-gray-500">Company</div>
            <div className="text-lg md:text-xl font-semibold text-gray-900">
              {name || "this company"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stars value={rating} />
          <span className="text-sm text-gray-700">
            {rating.toFixed(1)} / 5
          </span>
        </div>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} fill="#44AF69" />
      ))}
      {half ? <Half /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} fill="#E5E7EB" />
      ))}
    </span>
  );
}
const Star = ({ fill }: { fill: string }) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="inline-block"
  >
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15l-5-4.88 6.91-1.01z"
      fill={fill}
    />
  </svg>
);
const Half = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="inline-block"
  >
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
        <stop offset="50%" stopColor="#44AF69" />
        <stop offset="50%" stopColor="#E5E7EB" />
      </linearGradient>
    </defs>
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15l-5-4.88 6.91-1.01z"
      fill="url(#g)"
    />
  </svg>
);
