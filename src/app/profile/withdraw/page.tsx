'use client';

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

interface Deposit {
  id: string;
  coin: string;
  amountUsd: number;
  timestamp: any;
  unlockDate: Date;
}

export default function WithdrawPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !user) {
      forceRedirect('/login');
    }
  }, [user, loading, router]);

  // ✅ Fetch only currently invested deposits (exclude withdrawn)
  useEffect(() => {
    if (!user) return;

    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('type', '==', 'deposit'),
      where('status', '==', 'completed')
    );

    const unsub = onSnapshot(txQuery, snap => {
      const list: Deposit[] = snap.docs.map(d => {
        const data = d.data();
        const ts = data.timestamp?.toDate?.() ?? new Date();
        const unlock = new Date(ts.getTime());
        unlock.setFullYear(unlock.getFullYear() + 1);
        return {
          id: d.id,
          coin: data.coin,
          amountUsd: data.amountUsd ?? 0,
          timestamp: ts,
          unlockDate: unlock,
        };
      });
      setDeposits(list);
    });

    return () => unsub();
  }, [user]);

  // ✅ Countdown updater with animation
  useEffect(() => {
    if (deposits.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns: Record<string, string> = {};
      const newUnlocked: Record<string, boolean> = {};

      deposits.forEach(dep => {
        const diff = dep.unlockDate.getTime() - now.getTime();

        if (diff <= 0) {
          newCountdowns[dep.id] = 'Unlocked';
          newUnlocked[dep.id] = true;
        } else {
          const sec = Math.floor(diff / 1000) % 60;
          const min = Math.floor(diff / (1000 * 60)) % 60;
          const hrs = Math.floor(diff / (1000 * 60 * 60)) % 24;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const years = Math.floor(days / 365);
          const months = Math.floor((days % 365) / 30);
          const remDays = days % 30;

          newCountdowns[dep.id] = `${years}y ${months}m ${remDays}d ${hrs}h ${min}m ${sec}s`;
          newUnlocked[dep.id] = false;
        }
      });

      setCountdowns(newCountdowns);
      setUnlocked(newUnlocked);
    }, 1000);

    return () => clearInterval(interval);
  }, [deposits]);

  const handleWithdraw = async (dep: Deposit) => {
    if (!user) return;

    const ref = doc(db, 'transactions', dep.id);
    await updateDoc(ref, { status: 'withdrawn' });

    alert(`Withdrawn ${dep.amountUsd} USD from ${dep.coin}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-lg"
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Back
        </button>
        <h2 className="font-semibold text-lg">Withdraw</h2>
        <button
          onClick={() => forceRedirect('/profile/withdraw/history')}
          className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
        >
          History
        </button>
      </div>

      {/* Deposit List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-6 py-8 space-y-6"
      >
        {deposits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/60 mt-20"
          >
            No active deposits available for withdrawal.
          </motion.div>
        ) : (
          deposits.map(dep => (
            <motion.div
              key={dep.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition"
            >
              <h3 className="text-xl font-bold mb-2">{dep.coin}</h3>
              <p className="text-sm text-white/70 mb-3">
                ${dep.amountUsd.toFixed(2)} invested on{' '}
                {dep.timestamp.toLocaleDateString()}
              </p>

              {/* ✅ Animated Countdown */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdowns[dep.id]} // triggers animation every tick
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.25 }}
                  className={`text-lg font-semibold mb-4 text-center ${
                    unlocked[dep.id] ? 'text-green-400' : 'text-white'
                  }`}
                >
                  {countdowns[dep.id] || 'Calculating...'}
                </motion.div>
              </AnimatePresence>

              <motion.button
                whileHover={unlocked[dep.id] ? { scale: 1.05 } : {}}
                whileTap={unlocked[dep.id] ? { scale: 0.95 } : {}}
                disabled={!unlocked[dep.id]}
                onClick={() => handleWithdraw(dep)}
                className={`w-full py-3 rounded-xl text-lg font-semibold transition ${
                  unlocked[dep.id]
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]'
                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
              >
                {unlocked[dep.id] ? 'Withdraw Now' : 'Locked'}
              </motion.button>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
