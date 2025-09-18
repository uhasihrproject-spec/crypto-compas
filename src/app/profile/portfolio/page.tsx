'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '@/src/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Transaction {
  id: string;
  coin?: string;
  amountUsd?: number;
  status: string;
  timestamp?: any;
}

type Range = '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function PortfolioPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<{ date: string; balance: number; rawDate: Date }[]>([]);
  const [range, setRange] = useState<Range>('ALL');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(txQuery, snap => {
      const coins: Record<string, number> = {};
      let sum = 0;
      const points: { date: string; balance: number; rawDate: Date }[] = [];

      snap.docs.forEach(d => {
        const tx = d.data() as Transaction;
        if (tx.status === 'completed' && tx.amountUsd && tx.coin) {
          coins[tx.coin] = (coins[tx.coin] ?? 0) + tx.amountUsd;
          sum += tx.amountUsd;
        }
        // Track balance history
        if (tx.status === 'completed') {
          const t: Date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
          points.push({
            date: t.toLocaleDateString(),
            rawDate: t,
            balance: sum
          });
        }
      });

      setPortfolio(coins);
      setTotal(sum);
      setHistory(points);
    });

    return () => unsub();
  }, [user]);

  const fmt = (v?: number) =>
    (v ?? 0).toFixed ? (v ?? 0).toFixed(2) : '0.00';

  const percent = (value: number) =>
    total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  const filterHistory = () => {
    if (range === 'ALL') return history;

    const now = new Date();
    let cutoff: Date;

    switch (range) {
      case '1W':
        cutoff = new Date(now.setDate(now.getDate() - 7));
        break;
      case '1M':
        cutoff = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3M':
        cutoff = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1Y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return history;
    }

    return history.filter(h => h.rawDate >= cutoff);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="text-white">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
        <button onClick={() => router.back()} className="text-lg">←</button>
        <h2 className="font-semibold text-lg">Portfolio</h2>
        <div className="w-6" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 px-6 py-8 space-y-8"
      >
        {total === 0 ? (
          <div className="text-center text-white/60 mt-20">
            No investments yet. Start by investing.
          </div>
        ) : (
          <>
            {/* Growth Chart with Range Selector */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Growth Over Time</h3>
                <div className="flex space-x-2">
                  {(['1W', '1M', '3M', '1Y', 'ALL'] as Range[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 text-xs rounded-lg transition ${
                        range === r
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer>
                  <AreaChart key={range} data={filterHistory()}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30,30,60,0.9)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#6366F1"
                      fillOpacity={1}
                      fill="url(#colorGrowth)"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Coin List */}
            <div className="space-y-4">
              {Object.entries(portfolio).map(([coin, value]) => (
                <div
                  key={coin}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{coin}</span>
                    <span className="text-sm text-white/70">
                      {percent(value)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${percent(value)}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    ${fmt(value)} invested
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
