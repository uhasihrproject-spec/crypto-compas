"use client";

import { useEffect, useState, useRef } from "react";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  image: string;
}

export default function EdgeCoinCalculator() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string>("bitcoin");
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [expanded, setExpanded] = useState(false);
  const [pop, setPop] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch coins
  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => setCoins(data))
      .catch(console.error);
  }, []);

  // Smooth pop effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPop(true);
      setTimeout(() => setPop(false), 600);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCoinData = coins.find((c) => c.id === selectedCoin);

  const handleCoinSelect = (coinId: string) => {
    setSelectedCoin(coinId);
    setDropdownOpen(false);
  };

  return (
    <div
      className={`fixed top-1/2 right-0 z-50 transform -translate-y-1/2 transition-all duration-500 ${
        pop ? "scale-105" : "scale-100"
      }`}
      style={{ width: expanded ? 300 : 50 }}
    >
      <div className="relative">
        {/* Tab always visible, peeks more into screen */}
        <div
          className={`absolute right-0 top-0 w-14 h-14 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white flex items-center justify-center rounded-l-full shadow-lg cursor-pointer transition-all duration-500 ${
            expanded ? "translate-x-0" : "translate-x-[-8px]"
          }`}
          onMouseEnter={() => setExpanded(true)}
        >
          💰
        </div>

        {/* Panel */}
        {expanded && (
          <div
            onMouseLeave={() => setExpanded(false)}
            className="ml-[-50px] bg-white/10 backdrop-blur-lg rounded-l-3xl shadow-2xl p-4 flex flex-col gap-3 cursor-pointer transition-transform duration-300"
          >
            <h2 className="text-white font-semibold text-center">Crypto Calculator</h2>

            {/* USD Input */}
            <input
              type="number"
              value={usdAmount}
              onChange={(e) => setUsdAmount(parseFloat(e.target.value))}
              placeholder="USD Amount"
              className="px-3 py-2 rounded-2xl bg-gray-900/70 text-white w-full shadow focus:outline-none focus:ring-2 focus:ring-yellow-400/60 placeholder-gray-400"
            />

            {/* Coin Dropdown */}
            <div className="relative w-full" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-3 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white font-semibold flex justify-between items-center shadow"
              >
                {selectedCoinData ? selectedCoinData.name : "Select Coin"}
                <span className={`${dropdownOpen ? "rotate-180" : ""} transition-transform`}>▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full -right-0 translate-x-[-20px] w-72 mt-1 rounded-xl bg-gray-900/95 backdrop-blur-md shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto animate-slideDown">
                  {coins.map((coin) => (                 
                    
                   <div
                    key={coin.id}
                    onClick={() => handleCoinSelect(coin.id)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 hover:text-black transition-colors"
                    >
                    <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm text-white">{coin.name} ({coin.symbol.toUpperCase()})</span>
                   </div>
 
                    
                  ))}
                </div>
              )}
            </div>

            {/* Output */}
            <div className="mt-2 text-white text-center font-semibold px-3 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500/20 backdrop-blur-md shadow">
              {usdAmount > 0 && coins.length > 0
                ? `${(usdAmount / (selectedCoinData?.current_price || 1)).toFixed(6)} ${selectedCoin.toUpperCase()}`
                : "Enter USD to calculate"}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-slideDown {
          animation: slideDown 0.25s ease forwards;
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
