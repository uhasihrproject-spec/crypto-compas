'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '@/src/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Transaction {
  id: string;
  coin?: string;
  type: string;
  amountCoin?: number;
  amountUsd?: number;
  status: string;
  timestamp?: any;
}

export default function HistoryPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(txQuery, snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Transaction[];
      setTransactions(list);
    });
    return () => unsub();
  }, [user]);

  const fmt = (v?: number) => ((v ?? 0).toFixed ? (v ?? 0).toFixed(2) : '0.00');

  const formatDate = (ts?: any) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleString();
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
        <h2 className="font-semibold text-lg">History</h2>
        <div className="w-6" />
      </div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {transactions.length === 0 ? (
          <div className="text-center text-white/60 mt-20">
            No transactions yet. Start by investing.
          </div>
        ) : (
          transactions.map(tx => (
            <div
              key={tx.id}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 flex justify-between items-center"
            >
              {/* Left: Coin + Type */}
              <div>
                <div className="font-bold">{tx.coin || '---'}</div>
                <div className="text-xs text-white/60 capitalize">
                  {tx.type}
                </div>
              </div>

              {/* Middle: Amounts */}
              <div className="text-right">
                <div className="font-semibold">
                  {fmt(tx.amountCoin)} {tx.coin}
                </div>
                <div className="text-xs text-white/60">
                  ${fmt(tx.amountUsd)}
                </div>
              </div>

              {/* Right: Status + Time */}
              <div className="text-right">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : tx.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {tx.status === 'completed'
                    ? 'Confirmed'
                    : tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
                <div className="text-[10px] text-white/50 mt-1">
                  {formatDate(tx.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
