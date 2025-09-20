'use client';

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import Image from "next/image";

/**
 * ABOUT PAGE
 * - Hero (canvas circles)
 * - 12 sections all different: mission (glass), vision (split), who (accordion),
 *   what we do (auto carousel), executives (3D carousel), history (timeline),
 *   achievements (glass grid), core values (flip cards), services (tabs),
 *   partnerships (marquee), CSR & Future (parallax + CTA)
 *
 * Requires: TailwindCSS + framer-motion present in project.
 */

/* ---------------------- Helpers / Data ---------------------- */

const executives = [
  { name: "John Doe", role: "CEO" },
  { name: "Jane Smith", role: "CTO" },
  { name: "Michael Brown", role: "CFO" },
  { name: "Eldwin Asante", role: "COO" },
  { name: "Alice Johnson", role: "CMO" },
];

const whatWeDoCards = [
  { title: "Secure Wallets", desc: "Bank-grade security, multi-sig and hardware support." },
  { title: "Real-Time Analytics", desc: "Live market feed, alerts, and customizable dashboards." },
  { title: "AI Insights", desc: "Signals, trend analysis, and portfolio suggestions." },
  { title: "24/7 Support", desc: "Dedicated support across timezones." },
  { title: "Community Growth", desc: "Local meetups, developer grants, and learning resources." },
];

const achievements = [
  "Launched global exchange integration (2021)",
  "Reached 1M active users (2022)",
  "Awarded Fintech Innovator (2023)",
  "Open-sourced developer SDK (2024)",
  "Partnered with major custodians (2024)",
  "Launched mobile wallet beta (2025)",
];

/* ---------------------- Components ---------------------- */

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let circles: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];
    const colors = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.12)"];
    const numCircles = 40;
    let raf = 0;

    const resize = () => {
      canvas.width = typeof window !== "undefined" && window.innerWidth;
      canvas.height = typeof window !== "undefined" && window.innerHeight;
      circles = [];
      for (let i = 0; i < numCircles; i++) {
        const r = Math.random() * 60 + 20;
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r,
          dx: (Math.random() - 0.5) * 0.6,
          dy: (Math.random() - 0.5) * 0.6,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of circles) {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.dx;
        c.y += c.dy;
        if (c.x < -c.r || c.x > canvas.width + c.r) c.dx = -c.dx;
        if (c.y < -c.r || c.y > canvas.height + c.r) c.dy = -c.dy;
      }
      raf = requestAnimationFrame(animate);
    };

    typeof window !== "undefined" && window.addEventListener("resize", resize);
    resize();
    animate();
    return () => {
      typeof window !== "undefined" && window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* Accordion used for Who We Are / FAQ */
function Accordion({
  items,
  single = false,
}: {
  items: { title: string; body: string }[];
  single?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-4 w-full">
      {items.map((it, i) => (
        <div key={i} className="bg-white/6 backdrop-blur-md rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(single ? (open === i ? null : i) : open === i ? null : i)}
            className="w-full text-left px-5 py-4 flex justify-between items-center"
          >
            <span className="font-semibold text-lg">{it.title}</span>
            <span className="opacity-70">{open === i ? "—" : "+"}</span>
          </button>
          <div
            className={`px-5 pb-5 transition-all duration-300 ${open === i ? "max-h-96" : "max-h-0 overflow-hidden"}`}
          >
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{it.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Flip card for Core Values */
function FlipCard({ front, back }: { front: React.ReactNode; back: React.ReactNode }) {
  const [flipped, setFlipped] = useState(false);

  const handleTap = () => {
    setFlipped(true);
    setTimeout(() => setFlipped(false), 1500); // flips back after 1.5 seconds
  };

  return (
    <div className="w-72 h-44 perspective" onClick={handleTap}>
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d 
          ${flipped ? "rotate-y-180" : ""} hover:rotate-y-180`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white/6 rounded-xl p-6 flex items-center justify-center">
          <div>{front}</div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 flex items-center justify-center">
          <div className="text-gray-100">{back}</div>
        </div>
      </div>

      <style jsx>{`
        .perspective { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}

/* Simple tabs for Services */
function Tabs({ tabs }: { tabs: { id: string; title: string; body: string }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  return (
    <div className="w-full">
      <div className="flex gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded-full ${active === t.id ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "bg-white/6 text-gray-200"}`}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="bg-white/6 backdrop-blur-md rounded-xl p-6 text-gray-300">
        {tabs.find((t) => t.id === active)?.body}
      </div>
    </div>
  );
}

/* Auto-scroll marquee of logos for Partnerships */
function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden">
      <div className="flex animate-marquee gap-6">
        {items.concat(items).map((src, i) => (
          <div key={i} className="min-w-[140px] flex items-center justify-center p-4 bg-white/5 rounded-lg">
            {/* placeholder squares for logos */}
            <div className="w-24 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded" />
          </div>
        ))}
      </div>
      <style jsx>{`
        .animate-marquee { animation: marquee 18s linear infinite; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* 3D-ish executives carousel (auto scroll & hover tilt) */
function Exec3DCarousel() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pos = 0;
    let raf = 0;
    const step = () => {
      pos += 0.4;
      if (pos > el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className="flex gap-6 overflow-hidden py-6 px-3">
      {executives.concat(executives).map((e, i) => (
        <div
          key={i}
          className="min-w-[220px] bg-white/6 backdrop-blur-md rounded-2xl p-6 text-center transform transition transform-gpu hover:-translate-y-2 hover:scale-105 hover:shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 mx-auto mb-4" />
          <div className="font-semibold text-lg">{e.name}</div>
          <div className="text-sm text-gray-300">{e.role}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------- Page ---------------------- */

export default function AboutPage() {
  /* For accordions in History/FAQ */
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  /* Services tabs example */
  const servicesTabs = [
    { id: "dev", title: "Development", body: "Full-stack development services, Web3 integrations, APIs, testing and deployment." },
    { id: "design", title: "Design", body: "UX/UI, research, prototyping, visual identity and brand systems." },
    { id: "consult", title: "Consulting", body: "Strategy, roadmap, governance, compliance and tokenomics advisory." },
  ];

  /* Partnerships logos data (placeholders) */
  const partners = ["p1", "p2", "p3", "p4", "p5"];

  return (
    <main className="bg-gray-950 text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <HeroCanvas />
        <div className="relative z-10 max-w-3xl px-6">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            We build products that people love
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} className="mt-4 text-gray-300">
            Combining fintech experience, strong UX and secure engineering to make crypto simple and powerful.
          </motion.p>
        </div>
      </section>

      {/* MISSION (Glass card, center) */}
      <section className="max-w-5xl mx-auto my-16 px-6">
        <motion.div initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-white/6 backdrop-blur-lg rounded-2xl p-10 shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed">
            We exist to make digital finance accessible and trustworthy. Our mission is to build reliable products
            that empower individuals and organizations — enabling faster, safer, and more transparent transactions.
            We prioritize security, user education, and design that removes friction. By partnering with regulators,
            industry leaders, and communities, we push for standards that protect users while enabling innovation.
            Every line of code, support ticket, and design decision is made with the user’s best interests in mind,
            so people can focus on opportunity, not complexity.
          </p>
        </motion.div>
      </section>

      {/* VISION (Split layout) */}
      <section className="max-w-6xl mx-auto my-16 px-6 grid md:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ x: -50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="h-64 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-500/10 flex items-center justify-center">
          <div className="text-center px-6">
            {/* Placeholder graphic */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500/40 mx-auto mb-4" />
            <div className="text-white font-semibold">Vision in Action</div>
          </div>
        </motion.div>
        <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
          <h3 className="text-2xl font-bold mb-3">Our Vision</h3>
          <p className="text-gray-300 leading-relaxed">
            We envision a future where access to quality financial tools is universal. Our platform aims to
            reduce barriers to entry, making it easier for users of all skill levels to participate in digital
            economies. By focusing on accessibility, education, and robust infrastructure, we will enable a new
            generation of creators and businesses to thrive. This vision is the north star for product decisions,
            partnerships, and long-term strategy.
          </p>
        </motion.div>
      </section>

      {/* WHO WE ARE (Accordion) */}
      <section className="max-w-6xl mx-auto my-16 px-6">
        <h3 className="text-3xl font-bold mb-6 text-center">Who We Are</h3>
        <Accordion
          items={[
            {
              title: "Our Team",
              body:
                "A diverse team of engineers, designers, product and security experts. We work in small multidisciplinary squads that move fast but ship carefully. Our background spans startups, banks, and open-source projects, which gives a pragmatic balance of speed and safety.",
            },
            {
              title: "How We Work",
              body:
                "We emphasize user research, iteration, and strong engineering practices. Security reviews, code audits, and continuous delivery are baked into our workflow. We pair mentorship with autonomy so team members can grow while delivering impact.",
            },
            {
              title: "Culture & Values",
              body:
                "We value curiosity, empathy, and ownership. Feedback is direct and kind. We celebrate learning and prioritize long-term relationships with both customers and teammates.",
            },
          ]}
        />
      </section>

      {/* WHAT WE DO (Auto-scrolling cards carousel) */}
      <section className="my-16">
        <h3 className="text-3xl font-bold text-center mb-6">What We Do</h3>
        <div className="overflow-hidden">
          <div className="flex gap-6 animate-autoScroll">
            {whatWeDoCards.concat(whatWeDoCards).map((c, i) => (
              <div key={i} className="min-w-[300px] bg-white/5 backdrop-blur-md rounded-2xl p-6 m-4">
                <h4 className="font-semibold text-xl mb-2">{c.title}</h4>
                <p className="text-gray-300">{c.desc} We design and build these with strong privacy controls and product-grade resiliency.</p>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .animate-autoScroll { animation: autoScroll 18s linear infinite; }
          @keyframes autoScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* EXECUTIVES (3D carousel effect) */}
      <section className="my-16">
        <h3 className="text-3xl font-bold text-center mb-6">Our Executives</h3>
        <Exec3DCarousel />
      </section>

      {/* HISTORY (Timeline) */}
      <section className="max-w-6xl mx-auto my-16 px-6">
        <h3 className="text-3xl font-bold mb-8 text-center">Our Journey</h3>
        <div className="relative border-l border-gray-800 ml-4 pl-8 space-y-10">
          {[
            { year: "2020", text: "Founded by a small team with big ideas; launched first product." },
            { year: "2021", text: "Expanded to global markets and onboarded early partners." },
            { year: "2022", text: "Launched analytics suite and reached 100k users." },
            { year: "2023", text: "Introduced custody partnerships and developer SDK." },
            { year: "2024", text: "Mobile wallet beta and major exchange integrations." },
          ].map((t, i) => (
            <div key={i} className="relative pl-6">
              <div className="absolute -left-7 top-0 w-4 h-4 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400" />
              <div className="text-sm text-yellow-400 font-semibold">{t.year}</div>
              <p className="text-gray-300 mt-2">{t.text} This milestone highlighted our growth and commitment to product excellence.</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACHIEVEMENTS (Glass grid) */}
      <section className="my-16 bg-gradient-to-b from-transparent to-black/40 py-12">
        <h3 className="text-3xl font-bold text-center mb-8">Achievements</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
          {achievements.map((a, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="bg-white/6 backdrop-blur-md rounded-2xl p-6">
              <div className="text-lg font-semibold mb-2">{a.split(" (")[0]}</div>
              <p className="text-gray-300">Short explanation or extra detail about this achievement that highlights impact and scale. This is a concise but informative blurb.</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CORE VALUES (Flip cards) */}
      <section className="my-16">
        <h3 className="text-3xl font-bold text-center mb-8">Core Values</h3>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
          <FlipCard front={<div className="text-white font-semibold">Innovation</div>} back={<div>We encourage bold ideas and rapid learning to build better products.</div>} />
          <FlipCard front={<div className="text-white font-semibold">Integrity</div>} back={<div>We operate transparently and hold ourselves accountable to users.</div>} />
          <FlipCard front={<div className="text-white font-semibold">Customer First</div>} back={<div>Every decision starts with the user's needs and long-term success.</div>} />
        </div>
      </section>

      {/* SERVICES (Tabs) */}
      <section className="my-16">
        <h3 className="text-3xl font-bold text-center mb-8">Services</h3>
        <div className="max-w-5xl mx-auto px-6">
          <Tabs tabs={servicesTabs} />
        </div>
      </section>

      {/* PARTNERSHIPS (Marquee) */}
      <section className="my-16">
        <h3 className="text-3xl font-bold text-center mb-6">Partnerships</h3>
        <div className="max-w-6xl mx-auto px-6">
          <Marquee items={partners} />
        </div>
      </section>

      {/* CSR & FUTURE (Parallax two-column + CTA) */}
      <section className="relative my-20">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 px-6 items-center">
          <div className="bg-white/6 backdrop-blur-md rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Corporate Social Responsibility</h3>
            <p className="text-gray-300 leading-relaxed">We invest in education, community programs, and sustainability to make a measurable impact. Our CSR initiatives focus on access to learning, supporting local entrepreneurs, and environmental stewardship. We partner with NGOs and civic groups to scale meaningful programs that align with our values and mission. These programs are tracked transparently to ensure accountability and long-term benefit to communities.</p>
          </div>
          <div className="bg-white/6 backdrop-blur-md rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Future Goals</h3>
            <p className="text-gray-300 leading-relaxed">We plan to broaden our global footprint, ship native mobile experiences, and expand institutional-grade custody features. Technology investments include improved privacy, faster settlement, and deeper developer tooling. We imagine a platform that empowers users everywhere — from small businesses to institutional teams — to build, trade, and innovate safely.</p>
            <div className="mt-6 text-center">
              <a href="/signup" className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-black font-semibold shadow-xl">Join Our Mission</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </main>
  );
}
