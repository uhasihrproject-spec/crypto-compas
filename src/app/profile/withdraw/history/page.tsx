'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { auth, db } from '@/src/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface WithdrawTx {
  id: string;
  coin: string;
  amountUsd: number;
  timestamp: any;
}

export default function WithdrawHistoryPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawTx[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('type', '==', 'deposit'),
      where('status', '==', 'withdrawn'),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      const list: WithdrawTx[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          coin: data.coin,
          amountUsd: data.amountUsd ?? 0,
          timestamp: data.timestamp?.toDate?.() ?? new Date()
        };
      });
      setWithdrawals(list);
    });

    return () => unsub();
  }, [user]);

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
        <h2 className="font-semibold text-lg">Withdraw History</h2>
        <div className="w-6" />
      </div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 px-6 py-8 space-y-6"
      >
        {withdrawals.length === 0 ? (
          <div className="text-center text-white/60 mt-20">
            No past withdrawals found.
          </div>
        ) : (
          withdrawals.map(w => (
            <div
              key={w.id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
            >
              <h3 className="text-lg font-bold mb-2">{w.coin}</h3>
              <p className="text-sm text-white/70 mb-2">
                ${w.amountUsd.toFixed(2)}
              </p>
              <p className="text-xs text-white/50">
                Withdrawn on {w.timestamp.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
