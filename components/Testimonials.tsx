"use client";

import { useRef } from "react";
import { motion, useAnimation } from "framer-motion";

const testimonials = [
  {
    name: "Alice Johnson",
    role: "Crypto Enthusiast",
    feedback:
      "This platform is amazing! Real-time stats and security make trading so easy.",
  },
  {
    name: "Global Bank",
    role: "Partner",
    feedback:
      "We trust this platform for blockchain integrations. Reliable and fast.",
  },
  {
    name: "Bob Smith",
    role: "Investor",
    feedback:
      "The live market overview is extremely useful for decision making.",
  },
  {
    name: "Crypto World",
    role: "Partner",
    feedback: "Seamless, fast, and beautiful interface for all users.",
  },
];

// Duplicate array for seamless loop
const loopedTestimonials = [...testimonials, ...testimonials];

export default function Testimonials() {
  const carouselRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-extrabold text-center mb-12">
          What Our Users & Partners Say
        </h2>

        <motion.div
          ref={carouselRef}
          className="flex gap-8 cursor-grab"
          drag="x"
          dragConstraints={{ left: -1000, right: 0 }} // temporary, user can drag left/right
          whileTap={{ cursor: "grabbing" }}
        >
          <motion.div
            className="flex gap-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            }}
          >
            {loopedTestimonials.map((t, i) => (
              <motion.div
                key={i}
                className="flex-shrink-0 w-80 md:w-96 bg-gray-800/40 backdrop-blur-lg p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.07 }}
              >
                <p className="text-gray-300 mb-4 italic">"{t.feedback}"</p>
                <h4 className="font-bold text-white">{t.name}</h4>
                <span className="text-gray-400">{t.role}</span>
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 mt-4 animate-pulse" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
