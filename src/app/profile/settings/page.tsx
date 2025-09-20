'use client';

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

interface UserData {
  email?: string;
  balance: number;
  totalDeposit: number;
  totalProfit: number;
}

export default function ProfileSettings() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    email: '',
    balance: 0,
    totalDeposit: 0,
    totalProfit: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      forceRedirect('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const d = snap.data();
        setUserData({
          email: d.email ?? user.email ?? '',
          balance: d.balance ?? 0,
          totalDeposit: d.totalDeposit ?? 0,
          totalProfit: d.totalProfit ?? 0
        });
      }
    });
    return () => unsub();
  }, [user]);

  const fmt = (v?: number) => ((v ?? 0).toFixed ? (v ?? 0).toFixed(2) : '0.00');

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
        <h2 className="font-semibold text-lg">Profile</h2>
        <div className="w-6" />
      </div>

      {/* Profile Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 px-6 py-8 space-y-6"
      >
        {/* User Info Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
          <h3 className="text-xl font-bold mb-2">{userData.email}</h3>
          <p className="text-sm text-white/60">Account Email</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h4 className="text-sm text-white/70 mb-1">Balance</h4>
            <p className="text-2xl font-bold">${fmt(userData.balance)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h4 className="text-sm text-white/70 mb-1">Total Deposits</h4>
            <p className="text-2xl font-bold">${fmt(userData.totalDeposit)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h4 className="text-sm text-white/70 mb-1">Total Profit</h4>
            <p className="text-2xl font-bold">${fmt(userData.totalProfit)}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => forceRedirect('/profile')}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-lg font-semibold"
          >
            Go Back Home
          </button>

          <button
            onClick={() => forceRedirect('/profile/withdraw/history')}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition text-lg font-semibold"
          >
            View Withdraw History
          </button>
        </div>
      </motion.div>
    </div>
  );
}
