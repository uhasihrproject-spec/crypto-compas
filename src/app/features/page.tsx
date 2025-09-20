'use client';

"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

// Features data
const features = [
  { title: "Real-Time Market Data", description: "Track crypto prices live from multiple exchanges.", icon: "/icons/market.png" },
  { title: "Secure Wallet Integration", description: "Encrypted wallets, cold storage, and 2FA.", icon: "/icons/wallet.png" },
  { title: "Fast & Easy Transactions", description: "Send and receive crypto instantly.", icon: "/icons/transaction.png" },
  { title: "Portfolio Management", description: "Track investments with real-time P/L.", icon: "/icons/portfolio.png" },
  { title: "Advanced Trading Tools", description: "Professional trading tools and charts.", icon: "/icons/trading.png" },
  { title: "News & Insights", description: "Stay updated with crypto news and analysis.", icon: "/icons/news.png" },
];

// Testimonials
const testimonials = [
  { name: "Alice", feedback: "CryptoSite made trading so much easier.", avatar: "/avatars/alice.png" },
  { name: "Mark", feedback: "I trust CryptoSite for secure transactions.", avatar: "/avatars/mark.png" },
  { name: "Sara", feedback: "The live market data is top-notch!", avatar: "/avatars/sara.png" },
];

// FAQ
const faqs = [
  { q: "How secure is my wallet?", a: "Your wallet is encrypted, with optional 2FA." },
  { q: "Can I trade multiple cryptocurrencies?", a: "Yes, we support all major coins." },
  { q: "Are there fees for transactions?", a: "We offer low fees for all transactions." },
  { q: "Do you provide portfolio tracking?", a: "Yes, track your investments in real-time." },
];

export default function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const yBlob1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const yBlob2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotateBlob = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden px-6">
        <motion.div style={{ y: yBlob1, rotate: rotateBlob }} className="absolute w-96 h-96 bg-purple-600 rounded-full mix-blend-screen opacity-20 blur-3xl animate-spin-slow" />
        <motion.div style={{ y: yBlob2, rotate: rotateBlob }} className="absolute w-72 h-72 bg-pink-500 rounded-full mix-blend-screen opacity-15 blur-2xl animate-spin-reverse" />
        <motion.h1 initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }} transition={{duration:1}} className="text-5xl md:text-6xl font-bold mb-6">Discover Powerful Crypto Features</motion.h1>
        <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{duration:1, delay:0.5}} className="text-gray-300 max-w-xl">Manage, track, and trade your crypto assets with ease. Our tools are secure, fast, and designed for every trader.</motion.p>
        <motion.a initial={{ opacity:0, scale:0.8 }} whileInView={{ opacity:1, scale:1 }} transition={{duration:0.8, delay:1}} href="/get-started" className="mt-8 inline-block px-8 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:scale-105 animate-pulse">Get Started</motion.a>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Platform Features</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f,i) => (
            <motion.div key={i} className="bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl cursor-pointer hover:scale-105 hover:shadow-xl"
              initial={{ opacity:0, y:50, scale:0.95 }}
              whileInView={{ opacity:1, y:0, scale:1 }}
              viewport={{ once:true }}
              transition={{ delay:i*0.2 }}
            >
              <motion.div whileHover={{ scale:1.2, rotate:5 }} className="w-12 h-12 mb-4">
                <Image src={f.icon} alt={f.title} width={48} height={48} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 bg-gray-950 overflow-hidden">
        <motion.div className="absolute w-60 h-60 bg-blue-500 rounded-full mix-blend-screen opacity-10 blur-3xl top-0 left-0 animate-spin-slow"/>
        <motion.div className="absolute w-48 h-48 bg-pink-500 rounded-full mix-blend-screen opacity-10 blur-2xl bottom-0 right-0 animate-spin-reverse"/>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t,i)=>(
            <motion.div key={i} className="bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl hover:scale-105 hover:shadow-xl"
              initial={{ opacity:0, y:30 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay:i*0.2 }}
            >
              <div className="flex items-center mb-4 gap-3">
                <Image src={t.avatar} alt={t.name} width={40} height={40} className="rounded-full"/>
                <h4 className="font-semibold">{t.name}</h4>
              </div>
              <p className="text-gray-300 italic">"{t.feedback}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.h2 initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((f,i)=>(
            <motion.div key={i} className="bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl"
              initial={{ opacity:0, y:20 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay:i*0.2 }}
            >
              <h3 className="font-semibold mb-2">{f.q}</h3>
              <p className="text-gray-400">{f.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mobile App Coming Soon */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.h2 initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:1 }}>📱 Mobile App Coming Soon!</motion.h2>
        <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:1, delay:0.3 }} className="text-gray-400 mt-4">
          Stay tuned for our upcoming mobile app to manage your crypto on the go.
        </motion.p>
      </section>

      {/* Footer */}
      <Footer />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
