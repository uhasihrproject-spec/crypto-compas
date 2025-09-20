"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Globe, Wallet } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Transactions",
    desc: "Industry-leading encryption and blockchain verification keep your assets safe.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Experience instant transfers and trading with minimal fees.",
  },
  {
    icon: Globe,
    title: "Global Access",
    desc: "Trade and manage crypto from anywhere in the world, 24/7.",
  },
  {
    icon: Wallet,
    title: "Smart Wallet",
    desc: "Connect and manage multiple wallets with ease and transparency.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative z-10 bg-gray-950 py-20 px-6 text-white"
    >
      <div className="mx-auto max-w-6xl text-center">
        <motion.h2
          className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Powerful Features
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          Everything you need to manage your crypto journey — secure, fast, and
          borderless.
        </motion.p>

        {/* Feature Cards */}
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, index) => (
            <motion.div
              key={feat.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:bg-white/10"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <feat.icon className="mx-auto mb-4 h-12 w-12 text-blue-400" />
              <h3 className="text-xl font-semibold">{feat.title}</h3>
              <p className="mt-2 text-gray-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
