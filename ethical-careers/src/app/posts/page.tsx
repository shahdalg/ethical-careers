
// app/posts/page.tsx — Reviews page (server component)
// - Pulls posts from Firestore via getPosts()
// - Filters by ?company= in the URL (optional)
// - Shows a company header with total ★ rating (avg of available sub‑ratings)
// - Renders each review card: People / Planet / Transparency
// - Colors: plum #3D348B (headings), green #44AF69 (accents)

// app/posts/page.tsx — Reviews page (server component)
// app/posts/page.tsx — Reviews page (server component)
import Navbar from "@/app/components/page"; // ← fixed import
import { getPosts, Post } from "@/lib/getPosts";

export const dynamic = "force-dynamic";

// --- helpers ---
type SP = Record<string, string | string[] | undefined>;
const toStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const normalizeCompany = (s: string) => s.trim().toLowerCase();

const toDateString = (ts: any): string => {
  try {
    if (!ts) return "";
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
};

function averageRatings(posts: Post[]) {
  let sum = 0, count = 0;
  let pplSum = 0, pplCnt = 0;
  let priSum = 0, priCnt = 0;
  let traSum = 0, traCnt = 0;

  for (const p of posts) {
    const a = Number(p.peopleRating);
    const b = Number(p.planetRating);
    const c = Number(p.transparencyRating);
    if (Number.isFinite(a)) { pplSum += a; pplCnt++; sum += a; count++; }
    if (Number.isFinite(b)) { priSum += b; priCnt++; sum += b; count++; }
    if (Number.isFinite(c)) { traSum += c; traCnt++; sum += c; count++; }
  }

  const overall = count ? sum / count : 0;
  return {
    overall,
    people:       pplCnt ? pplSum / pplCnt : 0,
    planet:   priCnt ? priSum / priCnt : 0,
    transparency: traCnt ? traSum / traCnt : 0,
  };
}

function Stars({ value, size = 22 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const Star = ({ fill }: { fill: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="inline-block">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15l-5-4.88 6.91-1.01z" fill={fill} />
    </svg>
  );
  const Half = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="inline-block">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor="#44AF69" />
          <stop offset="50%" stopColor="#E5E7EB" />
        </linearGradient>
      </defs>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15l-5-4.88 6.91-1.01z" fill="url(#g)" />
    </svg>
  );
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value.toFixed(1)} out of 5`}>
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} fill="#44AF69" />)}
      {half ? <Half /> : null}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} fill="#E5E7EB" />)}
    </span>
  );
}

// Bigger rating + summary
function CompanyHeader({
  name,
  rating,
  summary,
  reviewsCount,
}: {
  name: string;
  rating: number;
  summary: string;
  reviewsCount: number;
}) {
  return (
    <section className="border border-gray-200 bg-white/70 backdrop-blur rounded-2xl p-5">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-[#44AF69]" />
            <div>
              <div className="text-xs text-gray-500">Company</div>
              <div className="text-xl md:text-2xl font-semibold text-gray-900">{name || "Demo Company"}</div>
            </div>
          </div>

          {/* Bigger rating */}
          <div className="flex items-center gap-3">
            <Stars value={rating} size={24} />
            <span className="text-3xl md:text-4xl font-extrabold text-[#3D348B] leading-none">
              {rating.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600 self-end pb-1">/ 5</span>
          </div>
        </div>

        {/* Summary line */}
        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
          {summary} <span className="text-gray-500">({reviewsCount} review{reviewsCount === 1 ? "" : "s"})</span>
        </p>
      </div>
    </section>
  );
}

function ReviewCard({ p }: { p: Post }) {
  return (
    <article className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{p.company || "—"}</div>
        <div className="text-xs text-gray-500">{toDateString(p.createdAt)}</div>
      </div>

      <div className="mt-3 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-[#3D348B] flex items-center gap-2">
            <img src="/images/people-fill.svg" alt="" className="h-5 w-5" /> People
          </h3>
          {p.peopleText && <p className="text-gray-800 whitespace-pre-wrap mt-1">{p.peopleText}</p>}
          {Number.isFinite(Number(p.peopleRating)) && (
            <div className="mt-1 text-sm text-gray-700">Rating: {p.peopleRating} / 5</div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-[#3D348B] flex items-center gap-2">
            <img src="/images/globe-americas.svg" alt="" className="h-5 w-5" /> Planet
          </h3>
          {p.planetText && <p className="text-gray-800 whitespace-pre-wrap mt-1">{p.planetText}</p>}
          {Number.isFinite(Number(p.planetRating)) && (
            <div className="mt-1 text-sm text-gray-700">Rating: {p.planetRating} / 5</div>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="font-semibold text-[#3D348B] flex items-center gap-2">
            <img src="/images/eyeglasses.svg" alt="" className="h-5 w-5" /> Transparency
          </h3>
          {p.transparencyText && (
            <p className="text-gray-800 whitespace-pre-wrap mt-1">{p.transparencyText}</p>
          )}
          {Number.isFinite(Number(p.transparencyRating)) && (
            <div className="mt-1 text-sm text-gray-700">Rating: {p.transparencyRating} / 5</div>
          )}
        </div>
      </div>
    </article>
  );
}


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white flex items-center justify-between">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-2">
        <Stars value={value || 0} size={16} />
        <div className="text-sm font-medium text-gray-800">{(value || 0).toFixed(2)} / 5</div>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const allPosts = await getPosts();

  const companyParam = toStr(sp.company);
  const filtered = companyParam
    ? allPosts.filter((p) => normalizeCompany(p.company || "") === normalizeCompany(companyParam))
    : allPosts;

  const avg = averageRatings(filtered);
  const companyName = companyParam || (filtered[0]?.company ?? "Demo Company");

  // Build a short summary sentence
  const parts = [
    `${companyName} averages ${avg.overall.toFixed(2)}/5 overall`,
    `People ${avg.people.toFixed(2)}`,
    `Planet ${avg.planet.toFixed(2)}`,
    `Transparency ${avg.transparency.toFixed(2)}`,
  ];
  const summary = parts.join(" · ");

  return (
  <main className="bg-gray-50 text-gray-800 min-h-screen">
    <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <CompanyHeader
          name={companyName}
          rating={avg.overall}
          summary={summary}
          reviewsCount={filtered.length}
        />

        <div className="mt-6 rounded-xl bg-white p-4 border border-gray-200">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="People" value={avg.people} />
            <Stat label="Planet" value={avg.planet} />
            <Stat label="Transparency" value={avg.transparency} />
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: "#3D348B" }}>
          Reviews
        </h2>

        <div className="grid gap-4">
          {filtered.length === 0 && (
            <div className="text-gray-500">No reviews yet for this company.</div>
          )}
          {filtered.map((p) => (
            <ReviewCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </main>
  );
}
