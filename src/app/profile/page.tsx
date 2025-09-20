'use client';

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import ChatWidget from '@/components/ChatWidget';

// ✅ Lucide icons
import { History, Home, User, LineChart, ArrowDownToLine, ArrowUpToLine, PieChart } from 'lucide-react';

interface UserData {
  balance: number;
  totalDeposit: number;
  totalProfit: number;
  holdings?: { [key: string]: number };
}

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

const COINS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  ADA: 'cardano',
  XRP: 'ripple',
  LTC: 'litecoin',
  MATIC: 'polygon',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  USDT: 'tether',
  USDC: 'usd-coin',
  LINK: 'chainlink',
  XMR: 'monero',
  BCH: 'bitcoin-cash',
};

export default function ProfileHome() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [userData, setUserData] = useState<UserData>({
    balance: 0,
    totalDeposit: 0,
    totalProfit: 0,
    holdings: {},
  });

  const [prices, setPrices] = useState<Record<string, CoinMarket>>({});
  const [priceLoading, setPriceLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      forceRedirect('/login');
    }
  }, [user, loading, router]);

  // Load user data
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          balance: 0,
          totalDeposit: 0,
          totalProfit: 0,
          holdings: {},
          createdAt: new Date(),
        });
        return;
      }
      const d = snap.data() || {};
      setUserData({
        balance: d.balance ?? 0,
        totalDeposit: d.totalDeposit ?? 0,
        totalProfit: d.totalProfit ?? 0,
        holdings: d.holdings ?? {},
      });
    });
    return () => unsub();
  }, [user]);

  // Fetch live prices
  useEffect(() => {
    async function fetchData() {
      try {
        const ids = Object.values(COINS).join(',');
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
        )}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: CoinMarket[] = await res.json();
        const mapped: Record<string, CoinMarket> = {};
        data.forEach((coin) => {
          const symbol = Object.keys(COINS).find(
            (k) => COINS[k] === coin.id
          )!;
          mapped[symbol] = coin;
        });
        setPrices(mapped);
      } catch (err) {
        console.error('Price fetch failed:', err);
      } finally {
        setPriceLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(v);

  if (loading || priceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="text-white animate-pulse text-lg">Loading…</div>
      </div>
    );
  }

  // Compute wallet values
  const walletValues = Object.keys(COINS).map((c) => {
    const amount = userData.holdings?.[c] ?? 0;
    const coin = prices[c];
    const usd = amount * (coin?.current_price ?? 0);
    return { coin: c, amount, usd, image: coin?.image };
  });

  const totalWalletUsd = walletValues.reduce((acc, w) => acc + w.usd, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      {/* Hero Balance with animated gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 pt-16 pb-12 text-center relative overflow-hidden"
      >
        <motion.div
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 via-purple-500/30 to-pink-500/30 blur-3xl"
        />
        <h1 className="text-4xl font-extrabold relative z-10">
          {fmtCurrency(userData.balance)}
        </h1>
        <p className="text-white/70 text-sm mt-2 relative z-10">
          Available Balance
        </p>

        {/* Four Hero Buttons */}
        {/* Four Hero Buttons */}
<div className="grid grid-cols-4 gap-6 mt-10 relative z-10">
  <button
    onClick={() => forceRedirect('/profile/invest')}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center 
      border border-white/20 shadow-md transition group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.8)]">
      <LineChart className="w-6 h-6" />
    </div>
    <span className="text-sm">Invest</span>
  </button>

  <button
    onClick={() => forceRedirect('/profile/withdraw')}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center 
      border border-white/20 shadow-md transition group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.8)]">
      <ArrowUpToLine className="w-6 h-6" />
    </div>
    <span className="text-sm">Withdraw</span>
  </button>

  <button
    onClick={() => forceRedirect('/profile/history')}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center 
      border border-white/20 shadow-md transition group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.8)]">
      <History className="w-6 h-6" />
    </div>
    <span className="text-sm">History</span>
  </button>

  <button
    onClick={() => forceRedirect('/profile/portfolio')}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center 
      border border-white/20 shadow-md transition group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.8)]">
      <PieChart className="w-6 h-6" />
    </div>
    <span className="text-sm">Portfolio</span>
  </button>
</div>

      </motion.div>

      {/* Wallets */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-28 max-w-2xl mx-auto w-full">
        <h3 className="font-semibold mb-3">My Wallets</h3>
        {walletValues.map((w) => {
          const percent =
            totalWalletUsd > 0 ? (w.usd / totalWalletUsd) * 100 : 0;
          return (
            <motion.div
              key={w.coin}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              onClick={() => forceRedirect(`/profile/invest?coin=${w.coin}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {w.image && (
                  <img
                    src={w.image}
                    alt={w.coin}
                    className="w-9 h-9 rounded-full"
                  />
                )}
                <div className="truncate">
                  <div className="font-medium">{w.coin}</div>
                  <div className="text-xs text-white/60 truncate">
                    {w.amount.toFixed(4)} {w.coin}
                  </div>
                </div>
              </div>
              <div className="text-right min-w-[100px]">
                <div className="font-semibold truncate">
                  {fmtCurrency(w.usd)}
                </div>
                <div className="text-xs text-white/60">
                  {percent.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Navbar with Floating Home */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-2xl mx-auto flex justify-between items-center px-10 py-3 relative">
          <button
            onClick={() => forceRedirect('/profile/history')}
            className="flex flex-col items-center text-xs text-white/70 hover:text-indigo-400 transition"
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </button>

          {/* Floating Home */}
          <button
            onClick={() => forceRedirect('/profile')}
            className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 rounded-full bg-indigo-600 flex flex-col items-center justify-center text-xs shadow-lg hover:scale-110 transition"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => forceRedirect('/profile/settings')}
            className="flex flex-col items-center text-xs text-white/70 hover:text-indigo-400 transition"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
