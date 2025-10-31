"use client";
import { useEffect, useRef } from "react";


export default function Home() {
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  revealRefs.current = [];

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
          }
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
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center px-8 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#44AF69] rounded rotate-6"></div>
            <h1 className="font-semibold text-lg text-[#3D348B] tracking-tight">
              Ethical Careers 🌱
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 text-sm">
            <a href="#companies" className="hover:text-[#3D348B] transition">Companies</a>
            <a href="#rankings" className="hover:text-[#3D348B] transition">Rankings</a>
            <a href="#how" className="hover:text-[#3D348B] transition">How it works</a>
            <a href="#contact" className="hover:text-[#3D348B] transition">Contact</a>
            <a 
              href="/login"
              className="bg-[#7678ED] text-white px-4 py-2 rounded-md shadow-md hover:brightness-110 transition"
            >
              Login
            </a>
          </nav>
        </div>
      </header>

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
          <a
            href="/companies"
            className="bg-[#F7B801] text-gray-900 px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl active:scale-[.98] transition"
          >
            Explore Companies
          </a>

          {/* decorative: factory girl & compass */}
          <img
            src="/images/factorygirl.png"
            alt="Illustration of a worker near a factory"
            className="pointer-events-none select-none absolute -bottom-10 -right-23 w-100 md:w-140 opacity-100"
            aria-hidden="true"
          />
          <img
            src="/images/Compss.png"
            alt="Compass graphic"
            className="pointer-events-none select-none absolute -bottom-0 left-10 w-28 md:w-90 opacity-100 rotate-6 animate-slow-spin"
            aria-hidden="true"
          />

          <img
            src="/images/needle.png"
            alt="Needle graphic"
            className="pointer-events-none select-none absolute -bottom-0 left-10 w-28 md:w-90 opacity-100 rotate-6 animate-slow-spin"
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
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-6 left-0 w-44 opacity-40"
        />
        <img
          src="/images/blob.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-50 right-1 w-56 opacity-70"
        />

        <h3 className="text-3xl font-bold mb-10 text-center text-[#3D348B]">
          Featured Companies
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { name: "Solara Energy", field: "Clean Tech", color: "#F7B801" },
            { name: "General Motors", field: "Automotive", color: "#7678ED" },
            { name: "EcoChain", field: "Sustainability", color: "#3D348B" },
          ].map((company) => (
            <article
              key={company.name}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div
                className="h-12 w-12 rounded-full mb-4"
                style={{ backgroundColor: company.color }}
              />
              <h4 className="text-xl font-semibold text-gray-800 mb-1">{company.name}</h4>
              <p className="text-gray-600">{company.field}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#3D348B]">
                Explore <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Rankings Section: People / Planet / Principles */}
<section
  id="rankings"
  ref={setRevealRef}
  className="reveal-start px-6 py-20 max-w-6xl mx-auto"
>
  <h3 className="text-3xl font-bold text-center text-[#3D348B] mb-10">
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
      How It Works ✨
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
          Our platform helps students and job‑seekers evaluate the ethical standing of companies
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
          href="mailto:hello@ethicalcareers.com"
          className="inline-block bg-[#7678ED] text-white px-8 py-3 rounded-lg hover:brightness-110 transition"
        >
          Contact Us
        </a>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#3D348B] text-white text-center py-6">
        <p className="text-sm">© {new Date().getFullYear()} Ethical Careers. Built with values 🌱</p>
      </footer>

      {/* Local styles for reveal animations */}
      <style jsx>{`
        .reveal-start { opacity: 0; transform: translateY(12px); transition: all .6s ease; }
        .reveal-in { opacity: 1; transform: translateY(0); }
      `}</style>
    </main>
  );
}
