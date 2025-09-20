'use client';

"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

const reasons = [
  "🚀 Track your portfolio in real time",
  "🔒 Secure & borderless transactions",
  "🌍 Access the future of digital finance",
  "⚡ Lightning-fast crypto swaps",
  "📈 Advanced analytics & insights",
  "🤝 Connect with a global community",
  "💳 Easy deposits & withdrawals",
];

export default function GetStartedPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % reasons.length);
    }, 3500); // change every 3.5s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-gray-950 text-center px-6">
      {/* Background Gradient Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-purple-900/30 to-gray-950"
        animate={{ y: ["0%", "-10%", "0%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl text-white">
        <motion.h1
          className="text-5xl font-extrabold sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Get Started with{" "}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CryptoCurrent
          </span>
        </motion.h1>

        {/* Carousel of Reasons */}
        <div className="relative mt-10 h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              className="text-xl sm:text-2xl font-medium text-gray-300"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.8 }}
            >
              {reasons[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-lg font-semibold shadow-lg transition"
            >
              Sign Up
            </motion.button>
          </Link>

          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-white/10 border border-gray-500/40 text-lg font-semibold text-white shadow-lg hover:bg-white/20 transition"
            >
              Log In
            </motion.button>
          </Link>
        </motion.div>

        {/* Go Back Home */}
        <div className="mt-8">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-sm rounded-lg bg-gray-800/70 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              ← Back to Home
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}
