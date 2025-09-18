"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";

// 🔹 50 FAQ questions (15 shown initially, rest searchable)
const faqData = [
  // Popular 15
  { question: "What is cryptocurrency?", answer: "Cryptocurrency is a type of digital currency secured by cryptography, usually based on blockchain technology." },
  { question: "How do I buy Bitcoin?", answer: "You can buy Bitcoin on exchanges like Binance, Coinbase, or through peer-to-peer platforms." },
  { question: "What is blockchain?", answer: "A blockchain is a decentralized digital ledger that records transactions across multiple computers." },
  { question: "Is crypto safe?", answer: "Crypto can be safe if you use secure wallets and exchanges, but it is also volatile and high risk." },
  { question: "What is Ethereum?", answer: "Ethereum is a blockchain platform that enables smart contracts and decentralized applications (dApps)." },
  { question: "How do I store my crypto?", answer: "You can store crypto in hardware wallets, software wallets, or exchange wallets depending on security preference." },
  { question: "What are stablecoins?", answer: "Stablecoins are cryptocurrencies pegged to a stable asset like USD or gold to reduce volatility." },
  { question: "What is DeFi?", answer: "DeFi (Decentralized Finance) refers to financial services like lending, borrowing, and trading built on blockchain." },
  { question: "What is a crypto wallet?", answer: "A crypto wallet is a digital tool to store and manage your cryptocurrency private keys and transactions." },
  { question: "Can I lose all my crypto?", answer: "Yes, due to volatility, hacks, scams, or lost private keys. Always practice good security." },
  { question: "What is an NFT?", answer: "NFTs (Non-Fungible Tokens) are unique blockchain-based assets representing ownership of digital or physical items." },
  { question: "What is Bitcoin mining?", answer: "Mining is the process of validating transactions and securing the network in exchange for new coins." },
  { question: "Is crypto legal?", answer: "Crypto legality varies by country. Some embrace it, others ban or heavily regulate it." },
  { question: "How do I avoid crypto scams?", answer: "Use trusted platforms, never share private keys, and beware of 'guaranteed returns' offers." },
  { question: "What is Web3?", answer: "Web3 is the next phase of the internet where decentralized apps and ownership via blockchain are core principles." },

  // 35 extra searchable questions
  { question: "What is a private key?", answer: "A private key is a secret code that proves ownership of cryptocurrency funds." },
  { question: "What is a public key?", answer: "A public key is the address used to receive funds on the blockchain." },
  { question: "What is staking?", answer: "Staking means locking up crypto to support network operations and earn rewards." },
  { question: "What is proof of work?", answer: "Proof of Work is a consensus mechanism requiring miners to solve puzzles to validate transactions." },
  { question: "What is proof of stake?", answer: "Proof of Stake allows validators to create new blocks based on the number of coins they hold." },
  { question: "What is a smart contract?", answer: "Smart contracts are self-executing programs on the blockchain with predefined rules." },
  { question: "Can I use crypto to shop online?", answer: "Yes, many retailers and platforms now accept crypto payments." },
  { question: "What is a DAO?", answer: "A Decentralized Autonomous Organization is a community-led entity governed by blockchain rules." },
  { question: "What is gas fee?", answer: "Gas fees are transaction costs paid to miners or validators for processing blockchain transactions." },
  { question: "What is a crypto exchange?", answer: "A crypto exchange is a platform for buying, selling, and trading cryptocurrencies." },
  { question: "What is a hardware wallet?", answer: "A hardware wallet is a physical device for securely storing private keys offline." },
  { question: "What is a seed phrase?", answer: "A seed phrase is a set of words that backs up and restores access to your crypto wallet." },
  { question: "Can crypto be traced?", answer: "Most crypto is pseudonymous, not fully anonymous. Transactions can be tracked on the blockchain." },
  { question: "What is Bitcoin halving?", answer: "Bitcoin halving is an event every 4 years where mining rewards are cut in half to control supply." },
  { question: "Can I mine crypto on my laptop?", answer: "It’s possible but inefficient. Mining now requires powerful hardware or cloud services." },
  { question: "What is a memecoin?", answer: "A memecoin is a crypto inspired by internet memes, often highly speculative and volatile." },
  { question: "Is crypto taxed?", answer: "In most countries, crypto is subject to tax on capital gains, income, or both." },
  { question: "What is liquidity in crypto?", answer: "Liquidity is how easily a crypto asset can be bought or sold without affecting price." },
  { question: "What is arbitrage in crypto?", answer: "Arbitrage is profiting by buying crypto cheaper on one exchange and selling higher on another." },
  { question: "What is a crypto airdrop?", answer: "Airdrops are free token distributions used as promotions or rewards." },
  { question: "What is a 51% attack?", answer: "A 51% attack occurs when a group controls most of a blockchain’s computing power." },
  { question: "What is cold storage?", answer: "Cold storage means keeping crypto offline in devices like hardware wallets or paper wallets." },
  { question: "What is hot wallet?", answer: "A hot wallet is connected to the internet and more convenient but less secure." },
  { question: "Can I lose my wallet if I forget my password?", answer: "If you lose your password and seed phrase, you may lose access permanently." },
  { question: "What is tokenomics?", answer: "Tokenomics refers to the economic design of a cryptocurrency including supply, demand, and incentives." },
  { question: "What is ICO?", answer: "An Initial Coin Offering is a fundraising method where tokens are sold before launch." },
  { question: "What is an IEO?", answer: "An Initial Exchange Offering is like an ICO but hosted on an exchange." },
  { question: "What is an IDO?", answer: "An Initial DEX Offering happens on decentralized exchanges." },
  { question: "What is a rug pull?", answer: "A rug pull is a scam where developers abandon a project after taking investor money." },
  { question: "What is Metaverse?", answer: "The Metaverse is a digital world blending VR, AR, and blockchain technology." },
  { question: "What is token burning?", answer: "Token burning permanently removes tokens from circulation to reduce supply." },
  { question: "What is yield farming?", answer: "Yield farming is earning rewards by lending or staking crypto in DeFi protocols." },
  { question: "What is liquidity pool?", answer: "Liquidity pools are collections of tokens locked in smart contracts for trading." },
  { question: "What is crypto volatility?", answer: "Volatility is the rapid and unpredictable change in crypto prices." },
  { question: "What is a Layer 2 solution?", answer: "Layer 2 solutions like Polygon help scale blockchains by processing transactions off-chain." },
  { question: "Can I recover lost crypto?", answer: "No, once lost or stolen, crypto is usually unrecoverable." },
];

// 🔹 Hero animation styles
const heroCanvasStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
};

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🔹 Circle animation effect
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let circles: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];
    const colors = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.1)"];
    const numCircles = 30;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      circles = [];
      for (let i = 0; i < numCircles; i++) {
        const r = Math.random() * 40 + 10;
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      circles.forEach((c) => {
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
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // 🔹 Filter FAQs
  const filteredFaqs = faqData.filter((faq) =>
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="bg-gray-950 text-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6">
        <canvas ref={heroCanvasRef} style={heroCanvasStyle}></canvas>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 relative z-10"
        >
          Frequently Asked Questions
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="relative w-full max-w-2xl z-10"
        >
          <input
            type="text"
            placeholder="Search for crypto questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-xl bg-gray-900 bg-opacity-70 text-white placeholder-gray-400 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-purple-500"
          />
          {search && (
            <div className="absolute left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-lg max-h-64 overflow-y-auto border border-gray-700">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelected(faq.question)}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  >
                    {faq.question}
                  </div>
                ))
              ) : (
                <p className="px-4 py-2 text-gray-400">No results found.</p>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* FAQ List */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Top Questions</h2>
        <div className="space-y-6">
          {faqData.slice(0, 15).map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="bg-gray-900 bg-opacity-70 p-6 rounded-xl shadow-lg cursor-pointer hover:bg-gray-800 transition"
              onClick={() => setSelected(faq.question)}
            >
              <h3 className="font-semibold">{faq.question}</h3>
              {selected === faq.question && (
                <p className="mt-3 text-gray-300">{faq.answer}</p>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </main>
  );
}
