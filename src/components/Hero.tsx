"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "next/navigation";

// Extended slides with gradients & text
const slides = [
  {
    title: "Your Gateway to the Future of Finance",
    subtitle: "Secure, fast, and borderless crypto solutions.",
    gradient: "from-blue-500 via-purple-600 to-pink-500",
  },
  {
    title: "Trade Smarter with Real-Time Insights",
    subtitle: "Stay ahead with powerful analytics and tracking tools.",
    gradient: "from-green-400 via-blue-500 to-purple-600",
  },
  {
    title: "Empowering Your Digital Economy",
    subtitle: "Manage, grow, and explore crypto like never before.",
    gradient: "from-yellow-400 via-orange-500 to-red-600",
  },
  {
    title: "Built for Everyone",
    subtitle: "Whether beginner or pro — we’ve got the right tools for you.",
    gradient: "from-purple-500 via-pink-500 to-red-400",
  },
  {
    title: "Your Security, Our Priority",
    subtitle: "Multi-layer encryption and safe transactions you can trust.",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
  },
];

export default function Hero() {
  const [user, setUser] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Cycle slides when logged in
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ---------- DEFAULT HERO (not logged in) ----------
  if (!user) {
    const circles = [
      { color: "bg-purple-500/40", size: "w-40 h-40", x: -200, y: -100 },
      { color: "bg-blue-500/30", size: "w-32 h-32", x: 200, y: -150 },
      { color: "bg-pink-500/20", size: "w-56 h-56", x: -250, y: 150 },
      { color: "bg-green-400/30", size: "w-28 h-28", x: 250, y: 180 },
    ];

    return (
      <section className="relative flex h-screen items-center justify-center overflow-hidden bg-gray-950 text-center">
        {/* Animated Circles */}
        {circles.map((circle, idx) => (
          <motion.div
            key={idx}
            className={`absolute rounded-full blur-3xl ${circle.color} ${circle.size}`}
            initial={{ x: circle.x, y: circle.y }}
            animate={{
              x: [circle.x, circle.x * -0.5, circle.x],
              y: [circle.y, circle.y * -0.5, circle.y],
            }}
            transition={{
              duration: 15 + idx * 5,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl px-6 text-white">
          <motion.h1
            className="text-5xl font-extrabold sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CryptoCompass
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            The future of finance starts here — secure, fast, and borderless
            crypto solutions.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            {/* Get Started Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-black rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition"
              onClick={() => forceRedirect("/get-started")}
            >
              Get Started
            </motion.button>

            {/* Learn More Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 border border-gray-300 bg-transparent rounded-lg font-semibold text-white shadow-lg hover:bg-white/20 transition"
              onClick={() => forceRedirect("/learn-more")}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </section>
    );
  }

  // ---------- LOGGED-IN HERO (carousel version) ----------
  const isAdmin = user?.email === "olivegray022@gmail.com";

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-gray-950 text-center">
      {/* Gradient Background */}
      <motion.div
        key={index}
        className={`absolute inset-0 bg-gradient-to-br ${slides[index].gradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6 text-white">
        <motion.h1
          key={`title-${index}`}
          className="text-5xl font-extrabold sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {slides[index].title}
        </motion.h1>

        <motion.p
          key={`subtitle-${index}`}
          className="mt-6 text-lg sm:text-xl text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {slides[index].subtitle}
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-black rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition"
            onClick={() =>
              isAdmin ? forceRedirect("/admin-console") : forceRedirect("/profile")
            }
          >
            {isAdmin ? "Go to Admin Console" : "View Your Profile"}
          </motion.button>
        </motion.div>

        {/* Slide Indicators */}
        <div className="mt-10 flex justify-center gap-3">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === index ? "bg-white" : "bg-white/40"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: i === index ? 1.2 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
