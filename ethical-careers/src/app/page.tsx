"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlobalPostSurveyModal from '@/components/GlobalPostSurveyModal';
import { getUserSurveyData, needsGlobalPostSurvey } from '@/lib/surveyHelpers';
import { withAuth } from '@/lib/withAuth';

const Home = () => {
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  revealRefs.current = [];

  // Track auth state
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const router = useRouter();
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Redirect to login if not authenticated
      if (!u) {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);
  const [showGlobalPost, setShowGlobalPost] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check global post-survey on load
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUserId(u.uid);
      const surveyData = await getUserSurveyData(u.uid);
      if (needsGlobalPostSurvey(surveyData)) {
        setShowGlobalPost(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("reveal-in");
        });
      },
      { threshold: 0.15 }
    );
    revealRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const setRevealRef = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-jakarta">
      {showGlobalPost && userId && (
        <GlobalPostSurveyModal
          userId={userId}
          onComplete={() => setShowGlobalPost(false)}
          onDismiss={() => setShowGlobalPost(false)}
        />
      )}
  {/* Navbar is provided globally in the layout — no local Navbar here to avoid duplicates */}


      {/* Hero Section with green background + decorative images */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#44AF69]/10" />
        <div className="relative flex flex-col items-center justify-center text-center py-24 px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#3D348B] mb-6 transition-all hover:scale-[1.02]">
            Find Ethical Companies,
            <span className="block">Build a Meaningful Career</span>
          </h2>
          <p className="max-w-2xl text-gray-700 mb-8">
            Discover companies that align with your values.
            Powered by community-driven reviews and insight.
          </p>
          <button
            type="button"
            onClick={() => {
              // If user is signed in, go straight to companies. Otherwise
              // redirect to login and include `from` so we can return after sign-in.
              if (user) router.push('/companies');
              else router.push('/login?from=/companies');
            }}
            className="bg-[#F7B801] text-gray-900 px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl active:scale-[.98] transition"
          >
            Explore Companies
          </button>

          {/* decorative: factory girl & compass */}
          <img
            src="/images/factorygirl.png"
            alt="Illustration of a worker near a factory"
            className="pointer-events-none select-none absolute -bottom-16 -right-20 w-[35vw] min-w-[280px] max-w-[560px] opacity-100 hidden md:block"
            aria-hidden="true"
          />
          <img
            src="/images/Compass.png"
            alt="Compass graphic"
            className="pointer-events-none select-none absolute -bottom-0 left-5 w-[24vw] min-w-[190px] max-w-[400px] opacity-100 rotate-6 hidden md:block"
            aria-hidden="true"
          />

          {/* subtle floating blobs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[#7678ED]/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#3D348B]/20 blur-2xl" />
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" ref={setRevealRef} className="reveal-start px-6 py-24 max-w-6xl mx-auto relative">
        {/* decorative squiggles & blob */}
        <img
          src="/images/Squiggle.png"
          alt="decorative squiggle"
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-6 left-0 w-[15vw] min-w-[120px] max-w-[176px] opacity-40"
        />
        <img
          src="/images/Blob.png"
          alt="Blob graphic"
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-50 right-1 w-[20vw] min-w-[160px] max-w-[224px] opacity-70"
        />

        <h3 className="text-4xl font-extrabold text-center text-[#3D348B] mb-16 tracking-wide">
          Featured Companies
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[ {
      name: "McKinsey & Company",
      field: "Consulting",
      link: "/companies/mckinsey-%26-company",
      logo: "/images/mckinsey.png", // 🧩 add your logo files under /public/logos/
      color: "#F7B801",
    },
    {
      name: "General Motors",
      field: "Automotive",
      link: "/companies/general-motors",
      logo: "/images/gm.png",
      color: "#7678ED",
    },
    {
      name: "General Dynamics",
      field: "Aerospace and Defense",
      link: "/companies/general-dynamics",
      logo: "/images/gd.png",
      color: "#3D348B",
    }].map((company) => (
    <Link key={company.name} href={company.link} className="block">
      <article className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full">
        {/* 👇 Logo or fallback circle */}
        {company.logo ? (
          <img
  src={company.logo}
  alt={`${company.name} logo`}
  className="h-18 w-18 mb-4 rounded-full object-contain border border-gray-200 bg-white p-1"

          />
        ) : (
          <div
            className="h-12 w-12 rounded-full mb-4"
            style={{ backgroundColor: company.color }}
          />
        )}

        <h4 className="text-xl font-semibold text-gray-800 mb-1">
          {company.name}
        </h4>
        <p className="text-gray-600">{company.field}</p>

        <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#3D348B]">
          Explore <span className="transition group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  ))}
</div>
      </section>

      {/* Rankings Section: People / Planet / Principles */}
      <section
        id="rankings"
        ref={setRevealRef}
        className="reveal-start px-6 py-20 max-w-6xl mx-auto"
      >
        <h3 className="text-4xl font-extrabold text-center text-[#3D348B] mb-16 tracking-wide">
          Ranking Categories
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "People",
              icon: "/images/people-fill.svg",
              desc: "Employee well-being, pay equity, inclusion, and safety.",
            },
            {
              title: "Planet",
              icon: "/images/globe-americas.svg",
              desc: "Emissions, materials, circularity, and supplier sustainability.",
            },
            {
              title: "Transparency",
              icon: "/images/eyeglasses.svg",
              desc: "Disclosure, governance, privacy, and community impact.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <img src={card.icon} alt="" aria-hidden="true" className="h-8 w-8" />
                <h4 className="text-xl font-semibold text-gray-800">{card.title}</h4>
              </div>
              <p className="text-gray-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ✨ How It Works */}
      <section
        id="how"
        ref={setRevealRef}
        className="reveal-start relative overflow-hidden py-28 w-full bg-[#FAFAFA]"
      >
        <div className="px-6 max-w-6xl mx-auto">
          <h3 className="text-4xl font-extrabold text-center text-[#3D348B] mb-16 tracking-wide">
            How It Works 
          </h3>

          <ol className="grid md:grid-cols-4 gap-8">
            {[
              { n: "01", t: "Create an account", d: "Sign up with your email to begin." },
              { n: "02", t: "Find a company", d: "Explore companies that align with your field." },
              { n: "03", t: "Fill the survey", d: "Share your thoughts anonymously." },
              { n: "04", t: "See the scores", d: "See the ethics reviews and ratings." },
            ].map((s) => (
              <li
                key={s.n}
                className="relative rounded-2xl border border-[#F7E08A] bg-white p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="text-5xl font-extrabold text-[#F7B801] opacity-90 mb-3 font-serif">
                  {s.n}
                </div>
                <div className="mt-1 text-lg font-semibold text-[#3D348B]">
                  {s.t}
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" ref={setRevealRef} className="reveal-start bg-[#3D348B]/5 py-20 text-center px-6">
        <h3 className="text-2xl font-bold text-[#3D348B] mb-4">Why Ethical Careers?</h3>
        <p className="max-w-3xl mx-auto text-gray-700 leading-relaxed">
          Today’s professionals seek more than a paycheck, we want purpose.
          Our platform helps students and job-seekers evaluate the ethical standing of companies
          through verified reviews.
        </p>
      </section>

      {/* Contact */}
      <section id="contact" ref={setRevealRef} className="reveal-start py-20 px-6 text-center">
        <h3 className="text-2xl font-bold text-[#3D348B] mb-4">Get in Touch</h3>
        <p className="text-gray-700 mb-8">
          Have feedback or ideas? Reach out and help shape the future of ethical work.
        </p>
        <a
          href="mailto:ethicalcareers@gmail.com"
          className="inline-block bg-[#7678ED] text-white px-8 py-3 rounded-lg hover:brightness-110 transition"
        >
          Contact Us
        </a>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#3D348B] text-white text-center py-6">
        <p className="text-sm">© {new Date().getFullYear()} Ethical Careers. Built with values 🌱</p>
      </footer>

      <style jsx>{`
        .reveal-start { opacity: 0; transform: translateY(12px); transition: all .6s ease; }
        .reveal-in { opacity: 1; transform: translateY(0); }
      `}</style>
    </main>
  );
};

export default withAuth(Home);

