'use client';

"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Twitter, Linkedin, Github } from "lucide-react";
import { motion } from "framer-motion";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanks for contacting us! We’ll get back soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />

      {/* Fullscreen Dark Animated Gradient Hero */}
      <section className="relative flex flex-col items-center justify-center h-screen overflow-hidden">
        {/* Animated Dark Gradient Background */}
        <motion.div
        className="absolute inset-0"
        style={{
            background: "linear-gradient(270deg, #0d0f2c, #1a1a3f, #3a1a5a, #0d0f2c)",
            backgroundSize: "800% 800%", // make it larger than screen for smooth movement
        }}
        animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"], // moves diagonally
        }}
        transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
        }}
        />


        {/* Hero Text */}
        <motion.h1
          className="relative text-6xl sm:text-7xl md:text-8xl font-extrabold text-white text-center z-10 px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Get in Touch
        </motion.h1>
        <motion.p
          className="relative mt-6 text-lg sm:text-xl text-gray-400 text-center z-10 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Reach out to us for feedback, questions, or collaboration opportunities.
        </motion.p>
      </section>

      {/* Contact Form Section with entrance animations */}
      <main className="flex flex-col items-center justify-center px-6 py-16 bg-gray-950">
        <motion.div
          className="max-w-4xl w-full bg-gray-900/80 p-10 rounded-xl shadow-lg backdrop-blur-md border border-white/10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              name="message"
              rows={5}
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
            >
              Send Message
            </button>
          </form>

          {/* Social Links */}
          <motion.div
            className="mt-10 flex justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <Link href="https://instagram.com" target="_blank">
              <Instagram className="text-white hover:text-pink-400 transition" />
            </Link>
            <Link href="https://twitter.com" target="_blank">
              <Twitter className="text-white hover:text-blue-400 transition" />
            </Link>
            <Link href="https://linkedin.com" target="_blank">
              <Linkedin className="text-white hover:text-blue-600 transition" />
            </Link>
            <Link href="https://github.com" target="_blank">
              <Github className="text-white hover:text-gray-400 transition" />
            </Link>
          </motion.div>

          {/* Direct Email */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <p className="text-gray-400">Or email us directly at:</p>
            <Link href="mailto:support@yourbrand.com" className="text-indigo-400 hover:underline">
              support@yourbrand.com
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}
