'use client';

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { auth, db } from '@/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import ChatWidget from '@/components/ChatWidget';

type Tab = 'users' | 'transactions' | 'profits' | 'controls';

interface User {
  id: string;
  email: string;
  balance: number;
  totalDeposit: number;
  totalProfit: number;
  holdings?: { [coin: string]: number };
  activePlan?: string;
  testUser?: boolean;
}

interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  coin: string;
  amountCoin: number;
  amountUsd: number;
  type: string;
  status: string;
  timestamp: Date;
}

export default function AdminConsole() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // UI & control states
  const [searchQuery, setSearchQuery] = useState('');
  const [profitInputs, setProfitInputs] = useState<{ [id: string]: number }>(
    {}
  );
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingBalance, setEditingBalance] = useState<number>(0);
  const [txFilter, setTxFilter] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [globalProfitAmount, setGlobalProfitAmount] = useState<number>(100);
  const [globalFeeAmount, setGlobalFeeAmount] = useState<number>(25);

  // Admin check & redirect non-admins
  useEffect(() => {
    if (!loading && user && user.email !== 'olivegray022@gmail.com') {
      forceRedirect('/');
    }
  }, [user, loading, router]);

  // USERS listener
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email ?? '',
          balance: Number(data.balance ?? 0),
          totalDeposit: Number(data.totalDeposit ?? 0),
          totalProfit: Number(data.totalProfit ?? 0),
          holdings: data.holdings ?? {},
          activePlan: data.activePlan ?? 'None',
          testUser: !!data.testUser,
        } as User;
      });
      setUsers(list);
    }, (err) => {
      console.error('Users listener error', err);
    });
    return () => unsub();
  }, []);

  // TRANSACTIONS listener
  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp ? new Date(data.timestamp) : new Date();
        return {
          id: d.id,
          userId: data.userId ?? '',
          userEmail: data.userEmail ?? '',
          coin: data.coin ?? 'USD',
          amountCoin: Number(data.amountCoin ?? 0),
          amountUsd: Number(data.amountUsd ?? 0),
          type: String(data.type ?? '').toLowerCase(),
          status: String(data.status ?? '').toLowerCase(),
          timestamp: ts,
        } as Transaction;
      }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
      setTransactions(list);
    }, (err) => {
      console.error('Transactions listener error', err);
    });
    return () => unsub();
  }, []);

  // Derived stats
  const totalUsers = users.length;
  const totalDeposits = users.reduce((s, u) => s + Number(u.totalDeposit || 0), 0);
  const totalProfits = users.reduce((s, u) => s + Number(u.totalProfit || 0), 0);
  const pendingTx = transactions.filter(t => t.status === 'pending').length;

  // Helper: log a transaction record safely
  const logTransaction = async (payload: Partial<Transaction> & { type: string; status?: string }) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: payload.userId ?? 'system',
        userEmail: payload.userEmail ?? 'system',
        coin: payload.coin ?? 'USD',
        amountCoin: payload.amountCoin ?? 0,
        amountUsd: payload.amountUsd ?? 0,
        type: payload.type,
        status: payload.status ?? 'completed',
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('logTransaction failed', err);
    }
  };

  // Approve deposit: update transaction.status, user's balance/totalDeposit and holdings[coin]
  const approveDeposit = async (tx: Transaction) => {
    try {
      const txRef = doc(db, 'transactions', tx.id);
      await updateDoc(txRef, { status: 'completed' });

      const userRef = doc(db, 'users', tx.userId);
      const u = users.find(x => x.id === tx.userId);
      if (!u) {
        alert('User not found for transaction');
        return;
      }

      const newHoldings = {
        ...(u.holdings ?? {}),
        [tx.coin]: (u.holdings?.[tx.coin] ?? 0) + Number(tx.amountCoin || 0),
      };

      await updateDoc(userRef, {
        balance: Number(u.balance || 0) + Number(tx.amountUsd || 0),
        totalDeposit: Number(u.totalDeposit || 0) + Number(tx.amountUsd || 0),
        holdings: newHoldings,
      });

      alert(`Approved deposit for ${u.email}`);
    } catch (err) {
      console.error('approveDeposit failed', err);
      alert('Error approving deposit — check console.');
    }
  };

  const rejectDeposit = async (tx: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'rejected' });
      alert('Transaction rejected');
    } catch (err) {
      console.error('rejectDeposit failed', err);
      alert('Error rejecting transaction');
    }
  };

  // Approve withdrawal: mark tx withdrawn, deduct balance + holdings
  const approveWithdrawal = async (tx: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'withdrawn' });

      const userRef = doc(db, 'users', tx.userId);
      const u = users.find(x => x.id === tx.userId);
      if (!u) return;

      const newHoldings = {
        ...(u.holdings ?? {}),
        [tx.coin]: Math.max((u.holdings?.[tx.coin] ?? 0) - Number(tx.amountCoin || 0), 0),
      };

      await updateDoc(userRef, {
        balance: Number(u.balance || 0) - Number(tx.amountUsd || 0),
        holdings: newHoldings,
      });

      alert(`Approved withdrawal for ${u.email}`);
    } catch (err) {
      console.error('approveWithdrawal failed', err);
      alert('Error approving withdrawal');
    }
  };

  // Per-user profit adjustment (can be negative)
  const adjustProfit = async (id: string, profit: number) => {
    try {
      const u = users.find(x => x.id === id);
      if (!u) return alert('User not found');

      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        balance: Number(u.balance || 0) + Number(profit || 0),
        totalProfit: Number(u.totalProfit || 0) + Number(profit || 0),
      });

      await logTransaction({
        userId: id,
        userEmail: u.email,
        coin: 'USD',
        amountUsd: profit,
        amountCoin: profit,
        type: 'profit',
        status: 'completed',
      });

      setProfitInputs(prev => ({ ...prev, [id]: 0 }));
      alert(`Applied profit ${profit} to ${u.email}`);
    } catch (err) {
      console.error('adjustProfit failed', err);
      alert('Error applying profit');
    }
  };

  // Global profit / fee (applies to all users)
  const globalProfit = async (amount: number) => {
    if (!amount) return alert('Enter an amount');
    if (!confirm(`Add ${amount} to all users as profit?`)) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const ops: Promise<any>[] = [];
      snap.forEach((d) => {
        const u: any = d.data();
        const ref = doc(db, 'users', d.id);
        const newBal = Number(u.balance || 0) + Number(amount || 0);
        const newTP = Number(u.totalProfit || 0) + Number(amount || 0);
        ops.push(updateDoc(ref, { balance: newBal, totalProfit: newTP }));
        ops.push(addDoc(collection(db, 'transactions'), {
          userId: d.id,
          userEmail: u.email ?? '',
          coin: 'USD',
          amountUsd: amount,
          amountCoin: amount,
          type: 'profit',
          status: 'completed',
          timestamp: new Date(),
        }));
      });
      await Promise.all(ops);
      alert(`Added ${amount} to all users`);
    } catch (err) {
      console.error('globalProfit failed', err);
      alert('Global profit failed');
    }
  };

  const globalFee = async (amount: number) => {
    if (!amount) return alert('Enter an amount');
    if (!confirm(`Deduct ${amount} from all users as fee?`)) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const ops: Promise<any>[] = [];
      snap.forEach((d) => {
        const u: any = d.data();
        const ref = doc(db, 'users', d.id);
        const newBal = Number(u.balance || 0) - Number(amount || 0);
        ops.push(updateDoc(ref, { balance: newBal }));
        ops.push(addDoc(collection(db, 'transactions'), {
          userId: d.id,
          userEmail: u.email ?? '',
          coin: 'USD',
          amountUsd: -Math.abs(amount),
          amountCoin: -Math.abs(amount),
          type: 'fee',
          status: 'completed',
          timestamp: new Date(),
        }));
      });
      await Promise.all(ops);
      alert(`Deducted ${amount} from all users`);
    } catch (err) {
      console.error('globalFee failed', err);
      alert('Global fee failed');
    }
  };

  // Reset test accounts only
  const resetTestAccounts = async () => {
    if (!confirm('Reset all test accounts?')) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const ops: Promise<any>[] = [];
      snap.forEach((d) => {
        const u: any = d.data();
        if (u.testUser) {
          const ref = doc(db, 'users', d.id);
          ops.push(updateDoc(ref, { balance: 0, totalDeposit: 0, totalProfit: 0, holdings: {} }));
        }
      });
      await Promise.all(ops);
      alert('Test accounts reset.');
    } catch (err) {
      console.error('resetTestAccounts failed', err);
      alert('Reset failed');
    }
  };

  // Master reset: zero all users but keep docs
  const resetAllAccounts = async () => {
    if (!confirm('⚠️ Reset ALL accounts to zero? This affects all users.')) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const ops: Promise<any>[] = [];
      snap.forEach((d) => {
        const ref = doc(db, 'users', d.id);
        ops.push(updateDoc(ref, { balance: 0, totalDeposit: 0, totalProfit: 0, holdings: {} }));
      });
      await Promise.all(ops);
      alert('All accounts reset to 0.');
    } catch (err) {
      console.error('resetAllAccounts failed', err);
      alert('Reset failed');
    }
  };

  // Delete all transactions permanently (danger)
  const deleteAllTransactions = async () => {
    if (!confirm('⚠️ Permanently DELETE all transactions? This cannot be undone.')) return;
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      const ops: Promise<any>[] = [];
      snap.forEach((d) => ops.push(deleteDoc(doc(db, 'transactions', d.id))));
      await Promise.all(ops);
      alert('All transactions deleted.');
    } catch (err) {
      console.error('deleteAllTransactions failed', err);
      alert('Delete failed');
    }
  };

  // Bulk approve / reject pending
  const bulkApprove = async () => {
    if (!confirm('Approve all pending transactions?')) return;
    setBulkProcessing(true);
    try {
      const pending = transactions.filter(t => t.status === 'pending');
      const ops: Promise<any>[] = [];
      for (const tx of pending) {
        if (tx.type === 'deposit') ops.push(approveDeposit(tx));
        else if (tx.type === 'withdraw' || tx.type === 'withdrawal') ops.push(approveWithdrawal(tx));
        else ops.push(approveDeposit(tx));
      }
      await Promise.all(ops);
      alert('Bulk approve finished.');
    } catch (err) {
      console.error('bulkApprove failed', err);
      alert('Bulk approve failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkReject = async () => {
    if (!confirm('Reject all pending transactions?')) return;
    setBulkProcessing(true);
    try {
      const pending = transactions.filter(t => t.status === 'pending');
      const ops = pending.map(t => rejectDeposit(t));
      await Promise.all(ops);
      alert('Bulk reject finished.');
    } catch (err) {
      console.error('bulkReject failed', err);
      alert('Bulk reject failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Per-user reset
  const resetUser = async (id: string) => {
    if (!confirm('Reset this user (balance, deposits, profits, holdings) ?')) return;
    try {
      await updateDoc(doc(db, 'users', id), { balance: 0, totalDeposit: 0, totalProfit: 0, holdings: {} });
      alert('User reset');
    } catch (err) {
      console.error('resetUser failed', err);
      alert('Reset user failed');
    }
  };

  // Inline save for editing balance
  const saveEditedBalance = async (id: string) => {
    try {
      const ref = doc(db, 'users', id);
      await updateDoc(ref, { balance: Number(editingBalance || 0) });
      setEditingUser(null);
      alert('Balance updated');
    } catch (err) {
      console.error('saveEditedBalance failed', err);
      alert('Failed updating balance');
    }
  };

  // Small helpers
  const fmt = (v?: number) => ((v ?? 0).toFixed ? (v ?? 0).toFixed(2) : '0.00');

  // Render
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="text-white">Loading admin console…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center backdrop-blur-md">
        <h2 className="text-2xl font-bold">Admin Console</h2>
        <span className="text-sm text-white/60">{user?.email}</span>
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-6">
        {[
          { label: 'Total Users', value: totalUsers },
          { label: 'Total Deposits', value: totalDeposits },
          { label: 'Total Profits', value: totalProfits },
          { label: 'Pending Transactions', value: pendingTx },
        ].map((stat, idx) => (
          <motion.div key={idx} whileHover={{ scale: 1.05 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center shadow-lg">
            <h4 className="text-sm text-white/60">{stat.label}</h4>
            <p className="text-2xl font-bold mt-2"><CountUp end={stat.value} duration={1.2} separator="," /></p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-4 px-6 py-4 border-b border-white/20">
        {(['users','transactions','profits','controls'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold">Manage Users</h3>
              <div className="flex gap-2">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by email" className="px-3 py-2 rounded bg-white/10 border border-white/20" />
                <button onClick={() => { setSearchQuery(''); setProfitInputs({}); }} className="px-3 py-2 bg-white/10 rounded">Reset</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-white/5 border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/10">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Total Deposits</th>
                    <th className="py-3 px-4">Total Profits</th>
                    <th className="py-3 px-4">Holdings</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                    <tr key={u.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-2 px-4">{u.email}</td>
                      <td className="py-2 px-4">${fmt(u.balance)}</td>
                      <td className="py-2 px-4">${fmt(u.totalDeposit)}</td>
                      <td className="py-2 px-4">${fmt(u.totalProfit)}</td>
                      <td className="py-2 px-4">
                        <div className="max-w-xs truncate">
                          {u.holdings && Object.keys(u.holdings).length > 0
                            ? Object.entries(u.holdings).map(([coin, amt]) => `${coin}:${Number(amt).toFixed(4)}`).join(', ')
                            : '—'}
                        </div>
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        {editingUser === u.id ? (
                          <>
                            <input type="number" value={editingBalance} onChange={e => setEditingBalance(Number(e.target.value))} className="w-28 px-2 py-1 rounded bg-white/10" />
                            <button onClick={() => saveEditedBalance(u.id)} className="px-3 py-1 bg-green-600 rounded text-xs">Save</button>
                            <button onClick={() => setEditingUser(null)} className="px-3 py-1 bg-white/10 rounded text-xs">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingUser(u.id); setEditingBalance(Number(u.balance || 0)); }} className="px-3 py-1 bg-indigo-600 rounded text-xs">Edit</button>
                        )}

                        <input type="number" placeholder="Profit +/-" value={profitInputs[u.id] ?? ''} onChange={e => setProfitInputs(prev => ({ ...prev, [u.id]: Number(e.target.value) }))} className="w-28 px-2 py-1 rounded bg-white/10 ml-2 text-xs" />
                        <button onClick={() => adjustProfit(u.id, Number(profitInputs[u.id] || 0))} className="px-3 py-1 bg-green-600 rounded text-xs">Apply</button>

                        <button onClick={() => resetUser(u.id)} className="px-3 py-1 bg-yellow-600 rounded text-xs">Reset</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold">Manage Transactions</h3>
              <div className="flex items-center gap-2">
                <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="px-3 py-2 rounded bg-white/10 border border-white/20">
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button onClick={bulkApprove} disabled={bulkProcessing} className="px-3 py-2 bg-green-600 rounded">{bulkProcessing ? 'Processing...' : 'Bulk Approve'}</button>
                <button onClick={bulkReject} disabled={bulkProcessing} className="px-3 py-2 bg-red-600 rounded">{bulkProcessing ? 'Processing...' : 'Bulk Reject'}</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-white/5 border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/10">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Coin</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => (txFilter ? t.status === txFilter : true)).map(tx => {
                    const u = users.find(uu => uu.id === tx.userId);
                    return (
                      <tr key={tx.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-2 px-4">{u?.email ?? tx.userEmail ?? tx.userId}</td>
                        <td className="py-2 px-4">{tx.coin}</td>
                        <td className="py-2 px-4">{tx.amountCoin} {tx.coin} (${Number(tx.amountUsd).toFixed(2)})</td>
                        <td className="py-2 px-4 capitalize">{tx.type}</td>
                        <td className="py-2 px-4">{tx.status}</td>
                        <td className="py-2 px-4">{tx.timestamp.toLocaleString()}</td>
                        <td className="py-2 px-4 space-x-2">
                          {tx.status === 'pending' && (
                            <>
                              <button onClick={() => { tx.type === 'deposit' ? approveDeposit(tx) : approveWithdrawal(tx); }} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs">Approve</button>
                              <button onClick={() => rejectDeposit(tx)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* PROFITS TAB */}
        {activeTab === 'profits' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-semibold mb-4">User Profit Control</h3>
            <p className="text-white/70">Use the per-user profit inputs in the Users tab or global controls below.</p>
          </motion.div>
        )}

        {/* CONTROLS TAB */}
        {activeTab === 'controls' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-semibold mb-4">Global Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="mb-2 font-medium">Global Profit</h4>
                <input type="number" value={globalProfitAmount} onChange={e => setGlobalProfitAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/10 mb-2" />
                <button onClick={() => globalProfit(Number(globalProfitAmount || 0))} className="w-full py-2 bg-green-600 rounded">+ Add To All</button>
              </div>

              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="mb-2 font-medium">Global Fee</h4>
                <input type="number" value={globalFeeAmount} onChange={e => setGlobalFeeAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/10 mb-2" />
                <button onClick={() => globalFee(Number(globalFeeAmount || 0))} className="w-full py-2 bg-red-600 rounded">- Deduct From All</button>
              </div>

              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="mb-2 font-medium">Test Accounts</h4>
                <p className="text-white/60 mb-2">Reset users flagged with <code>testUser</code>.</p>
                <button onClick={resetTestAccounts} className="w-full py-2 bg-yellow-600 rounded">Reset Test Accounts</button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 mt-6">
              <h4 className="mb-2 font-medium text-red-400">⚠️ Danger Zone</h4>
              <p className="text-white/60 mb-3">Actions below are destructive. Use with caution.</p>
              <button onClick={resetAllAccounts} className="w-full py-2 mb-2 bg-yellow-700 hover:bg-yellow-800 rounded">🔄 Reset All Accounts</button>
              <button onClick={deleteAllTransactions} className="w-full py-2 bg-red-700 hover:bg-red-800 rounded">🗑️ Delete All Transactions</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Widget (floating) */}
      <div className="fixed bottom-4 right-4 z-50">
        <ChatWidget />
      </div>
    </div>
  );
}
