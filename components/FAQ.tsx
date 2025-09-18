"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
<span className="text-blue-400 text-xl mr-2">💬</span>


const faqs = [
  {
    question: "How do I create an account?",
    answer:
      "Click on the Sign Up button in the navbar, fill in your details, verify your email, and start trading instantly.",
  },
  {
    question: "Is my crypto safe on this platform?",
    answer:
      "Yes! We use bank-level encryption, two-factor authentication, and cold storage for user funds.",
  },
  {
    question: "Can I trade multiple cryptocurrencies?",
    answer:
      "Absolutely! Our platform supports Bitcoin, Ethereum, Solana, Binance Coin, and many more.",
  },
  {
    question: "Are there any fees?",
    answer:
      "Trading fees are minimal and transparent. You can view all fees on our Fees page.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-5xl font-extrabold text-center mb-16">
          Frequently Asked Questions
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              onClick={() => toggle(i)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-blue-400 text-xl mr-2">💬</span>
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  {faq.question}
                </h3>
              </div>

              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-4 text-gray-300 text-base md:text-lg"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
