// src/components/About.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function About() {
  return (
    <section className="relative py-20 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-80 md:h-96 rounded-3xl overflow-hidden shadow-lg"
        >
          <Image
            src="/images/crypto-illustration.png"
            alt="Crypto Illustration"
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Right Text */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Why Choose Us
          </h2>
          <p className="text-gray-300 mb-6">
            Our platform is designed for traders, investors, and crypto enthusiasts alike. 
            We provide real-time market data, secure transactions, and a seamless trading experience.
          </p>
          <ul className="space-y-4">
            {[
              "Real-time crypto prices & analytics",
              "Secure and transparent platform",
              "24/7 customer support & community",
              "Global access to multiple cryptocurrencies"
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
          <button className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition">
            Learn More
          </button>
        </motion.div>
      </div>
    </section>
  );
}
