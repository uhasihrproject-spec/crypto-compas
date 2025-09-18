"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  image: string;
}

const COINS = ["bitcoin", "ethereum", "binancecoin", "solana"];

export default function LiveStats() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(
          ","
        )}&order=market_cap_desc&per_page=4&page=1&sparkline=false`
      );
      const data: Coin[] = await res.json();
      setCoins(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const AnimatedPrice = ({ price }: { price: number }) => {
    const [displayPrice, setDisplayPrice] = useState(0);
    useEffect(() => {
      let start = 0;
      const duration = 800;
      const increment = price / (duration / 20);
      const counter = setInterval(() => {
        start += increment;
        if (start >= price) {
          start = price;
          clearInterval(counter);
        }
        setDisplayPrice(start);
      }, 20);
      return () => clearInterval(counter);
    }, [price]);
    return <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">${displayPrice.toLocaleString()}</span>;
  };

  return (
    <section className="relative py-20 bg-gray-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-white">
          Live Market Overview
        </h2>

        {loading && <p className="text-center text-gray-400">Loading live prices...</p>}
        {error && <p className="text-center text-red-500">Failed to fetch data. Try again later.</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {coins.map((coin) => (
              <motion.div
                key={coin.id}
                className="relative flex flex-col items-center bg-gray-800/40 backdrop-blur-lg rounded-3xl p-6 shadow-lg hover:scale-105 transition-transform duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-16 h-16 relative mb-3">
                  <Image
                    src={coin.image}
                    alt={coin.name}
                    width={64}
                    height={64}
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{coin.name}</h3>
                <AnimatedPrice price={coin.current_price} />
                <span className="text-gray-300 uppercase mt-1">{coin.symbol}</span>
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
