'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Copy, Check, RefreshCw } from 'lucide-react';

/**
 * Supported coins.
 * - id: coingecko slug used for price & image API calls
 * - address: admin deposit address for that coin
 *
 * Add/remove coins here as you need; 20 examples included.
 */
const COINS: { [symbol: string]: { id: string; address: string } } = {
  BTC: { id: 'bitcoin', address: '1AdminBTCWalletXYZ123...' },
  ETH: { id: 'ethereum', address: '0xAdminETHWalletXYZ123...' },
  SOL: { id: 'solana', address: 'SolanaAdminWalletXYZ...' },
  BNB: { id: 'binancecoin', address: 'bnbAdminWalletXYZ123...' },
  ADA: { id: 'cardano', address: 'addrAdminADAWalletXYZ123...' },
  XRP: { id: 'ripple', address: 'rAdminXRPWalletXYZ123...' },
  LTC: { id: 'litecoin', address: 'ltcAdminWalletXYZ123...' },
  MATIC: { id: 'polygon', address: 'maticAdminWalletXYZ123...' },
  AVAX: { id: 'avalanche-2', address: 'avaxAdminWalletXYZ123...' },
  DOT: { id: 'polkadot', address: 'dotAdminWalletXYZ123...' },
  USDT: { id: 'tether', address: 'usdtAdminWalletXYZ123...' },
  USDC: { id: 'usd-coin', address: 'usdcAdminWalletXYZ123...' },
  LINK: { id: 'chainlink', address: 'linkAdminWalletXYZ123...' },
  XMR: { id: 'monero', address: 'xmrAdminWalletXYZ123...' },
  BCH: { id: 'bitcoin-cash', address: 'bchAdminWalletXYZ123...' },
  TRX: { id: 'tron', address: 'trxAdminWalletXYZ123...' },
  SHIB: { id: 'shiba-inu', address: 'shibAdminWalletXYZ123...' },
  DOGE: { id: 'dogecoin', address: 'dogeAdminWalletXYZ123...' },
  AAVE: { id: 'aave', address: 'aaveAdminWalletXYZ123...' },
  UNI: { id: 'uniswap', address: 'uniAdminWalletXYZ123...' },
};

// small format helpers
const fmtUsd = (v: number | null | undefined) =>
  typeof v === 'number' && !isNaN(v)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
    : '$0.00';
const fmtCoin = (v?: number, d = 6) =>
  typeof v === 'number' && !isNaN(v) ? Number(v).toFixed(d).replace(/\.?0+$/, (m) => (m ? m : '')) : `0.${'0'.repeat(d)}`;

/**
 * Invest page
 */
export default function InvestPage() {
  // auth + routing
  const [user] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  // coin selection
  const initialCoin = searchParams?.get('coin') ?? 'BTC';
  const [coin, setCoin] = useState<string>(initialCoin in COINS ? initialCoin : 'BTC');

  // input & conversion
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [coinAmount, setCoinAmount] = useState<number>(0);

  // price & images
  const [price, setPrice] = useState<number>(0); // 1 COIN => price USD
  const [images, setImages] = useState<Record<string, string | null>>({}); // coin => image url (large)
  const [imgLoading, setImgLoading] = useState<Record<string, boolean>>({}); // per-coin loading state

  // transactions + UI state
  const [creating, setCreating] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'pending' | 'completed' | 'rejected' | null>(null);

  // copy feedback + toast
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // container width to avoid stretched layout
  const containerClass = 'max-w-xl mx-auto w-full';

  // --------------------------
  // Preload images for all coins (front-end only)
  // - Tries to fetch `/coins/{id}` and extract image.large
  // - Runs once at mount. Fallback handled later.
  // --------------------------
  useEffect(() => {
    let mounted = true;
    const preloadAll = async () => {
      const entries = Object.entries(COINS);
      const nextImages: Record<string, string | null> = {};
      const nextLoading: Record<string, boolean> = {};
      await Promise.all(
        entries.map(async ([sym, info]) => {
          nextLoading[sym] = true;
          try {
            const res = await fetch(
              `https://api.coingecko.com/api/v3/coins/${info.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
            );
            if (!mounted) return;
            if (!res.ok) {
              nextImages[sym] = null;
            } else {
              const data = await res.json();
              nextImages[sym] = data?.image?.large ?? null;
            }
          } catch {
            nextImages[sym] = null;
          } finally {
            nextLoading[sym] = false;
          }
        })
      );
      if (mounted) {
        setImages(prev => ({ ...prev, ...nextImages }));
        setImgLoading(prev => ({ ...prev, ...nextLoading }));
      }
    };
    preloadAll();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // --------------------------
  // Fetch price for selected coin
  // - Fetches simple/price endpoint
  // - Refresh every 30s
  // - Graceful fallback on error
  // --------------------------
  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      const id = COINS[coin].id;
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        if (!mounted) return;
        if (!res.ok) {
          setPrice(0);
          return;
        }
        const data = await res.json();
        setPrice(data?.[id]?.usd ?? 0);
      } catch (err) {
        console.warn('price fetch failed', err);
        if (mounted) setPrice(0);
      }
    };
    fetchPrice();
    const t = setInterval(fetchPrice, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [coin]);

  // --------------------------
  // Conversion: USD -> coin amount
  // --------------------------
  useEffect(() => {
    const usd = parseFloat(usdAmount);
    if (!usdAmount || !price || price <= 0 || isNaN(usd)) {
      setCoinAmount(0);
      return;
    }
    setCoinAmount(usd / price);
  }, [usdAmount, price]);

  // --------------------------
  // Watch transaction status realtime if tx created
  // --------------------------
  useEffect(() => {
    if (!txId) return;
    const ref = doc(db, 'transactions', txId);
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      if (data?.status && data.status !== txStatus) setTxStatus(data.status);
    }, (err) => console.error('tx snapshot err', err));
    return () => unsub();
  }, [txId, txStatus]);

  // --------------------------
  // Small toast helper
  // --------------------------
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // --------------------------
  // Copy wallet & animate check
  // --------------------------
  const handleCopy = async () => {
    const addr = COINS[coin].address;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      showToast('Address copied');
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('copy failed', err);
      showToast('Copy failed');
    }
  };

  // --------------------------
  // Confirm -> create transaction doc (pending)
  // --------------------------
  const handleConfirm = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const usd = parseFloat(usdAmount);
    if (!usd || usd <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'deposit',
        coin,
        amountUsd: usd,
        amountCoin: coinAmount,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      setTxId(docRef.id);
      setTxStatus('pending');
      showToast('Transaction created (pending)');
    } catch (err) {
      console.error('create tx failed', err);
      showToast('Failed to create transaction');
    } finally {
      setCreating(false);
    }
  };

  // --------------------------
  // Derived values
  // --------------------------
  const oneUsdToCoin = price > 0 ? 1 / price : 0;
  const coinImage = images[coin] ?? null;

  // --------------------------
  // Render: transaction state (no emoji, animated svgs)
  // --------------------------
  const TxState = () => {
    if (!txStatus) return null;
    if (txStatus === 'pending') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-6"
          />
          <h3 className="text-2xl font-semibold">Transaction Pending</h3>
          <p className="text-white/70 mt-2">Waiting for admin approval</p>
        </div>
      );
    }
    if (txStatus === 'completed') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.svg
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 text-green-400 mb-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9 }}
            />
          </motion.svg>
          <h3 className="text-2xl font-semibold">Payment Confirmed</h3>
          <p className="text-white/70 mt-2">Funds added to your balance</p>
        </div>
      );
    }
    if (txStatus === 'rejected') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.svg
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 text-red-400 mb-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <motion.line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            />
          </motion.svg>
          <h3 className="text-2xl font-semibold">Payment Rejected</h3>
          <p className="text-white/70 mt-2">Contact support for help</p>
        </div>
      );
    }
    return null;
  };

  // --------------------------
  // UI: actual page
  // --------------------------
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
      {/* animated gradient layer (subtle) */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        initial={{ backgroundPosition: '0% 50%', opacity: 0.9 }}
        animate={{ backgroundPosition: '100% 50%' }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(270deg, rgba(14,30,62,0.9), rgba(75,44,163,0.75), rgba(12,12,21,0.85))',
          backgroundSize: '600% 600%',
          filter: 'saturate(1.05) blur(8px)',
        }}
      />
      {/* dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/35 z-0" />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/10">
        <button onClick={() => router.back()} className="text-lg opacity-90">←</button>
        <h1 className="text-lg font-semibold">Invest</h1>
        <div className="w-6" />
      </header>

      {/* main */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* If transaction exists, show tx state full-screen style */}
        {txStatus ? (
          <TxState />
        ) : (
          <section className={`px-6 py-8 flex-1 overflow-auto ${containerClass} w-full`}>
            {/* coin header: image + select + price info */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white/5 border border-white/6 rounded-2xl p-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                {/* coin image or fallback */}
                <div className="w-14 h-14 flex-shrink-0">
                  {imgLoading[coin] ? (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-pulse" />
                  ) : coinImage ? (
                    <img
                      src={coinImage}
                      alt={coin}
                      className="w-14 h-14 rounded-full object-cover shadow"
                      onError={() => {
                        setImages(prev => ({ ...prev, [coin]: null }));
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-lg font-bold">
                      {coin[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-white/60">Select Coin</label>
                  <div className="flex gap-3 items-center">
                    <select
                      value={coin}
                      onChange={(e) => setCoin(e.target.value)}
                      className="w-full bg-transparent text-purple-600 px-2 py-2 rounded-md border border-white/8"
                    >
                      {Object.keys(COINS).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      title="Refresh price"
                      onClick={() => {
                        // quick refresh by toggling price fetch effect
                        // just re-run price effect by setting price=price (noop) then fetch manually:
                        (async () => {
                          try {
                            const id = COINS[coin].id;
                            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
                            const data = await res.json();
                            setPrice(data?.[id]?.usd ?? 0);
                            showToast('Price refreshed');
                          } catch {
                            showToast('Price refresh failed');
                          }
                        })();
                      }}
                      className="p-2 bg-white/5 rounded-md"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-white/60 flex gap-4 items-center">
                    <div>1 {coin} ≈ <span className="font-medium">{fmtUsd(price)}</span></div>
                    <div className="h-4 border-l border-white/8" />
                    <div>1 USD ≈ <span className="font-medium">{fmtCoin(oneUsdToCoin, 8)} {coin}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* USD input — borderless, centered hero feel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mt-6 text-center"
            >
              <div className="mx-auto max-w-lg">
                <input
                  inputMode="decimal"
                  type="number"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="Enter USD"
                  className="w-full bg-transparent text-center text-5xl sm:text-6xl font-extrabold placeholder-white/30 focus:outline-none"
                />
                <div className="mt-3 text-sm text-white/60">
                  ≈ <span className="font-medium">{fmtCoin(coinAmount, 8)}</span> {coin}
                </div>
              </div>
            </motion.div>

            {/* wallet address & copy */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="mt-8 bg-white/5 border border-white/6 rounded-2xl p-4 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-white/70 mb-2">Send to this address</div>
                  <div className="text-xs font-mono break-words bg-black/40 p-3 rounded-md">{COINS[coin].address}</div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition"
                  >
                    <AnimatePresence mode="wait">
                      {!copied ? (
                        <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Copy size={16} />
                        </motion.span>
                      ) : (
                        <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Check size={16} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-sm font-medium">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <div className="text-xs text-white/50">Ensure you send the correct network</div>
                </div>
              </div>
            </motion.div>
          </section>
        )}
      </main>

      {/* sticky confirm */}
      {!txStatus && (
        <footer className="relative z-10 p-6 border-t border-white/10 bg-white/5 backdrop-blur-md">
          <div className={`mx-auto ${containerClass}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-white/60">You will invest</div>
                <div className="text-lg font-semibold">{usdAmount ? fmtUsd(Number(usdAmount)) : '$0.00'} • {fmtCoin(coinAmount, 8)} {coin}</div>
              </div>

              <div className="w-48 flex-shrink-0">
                <button
                  onClick={handleConfirm}
                  disabled={creating || !usdAmount || Number(usdAmount) <= 0}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition ${(!usdAmount || Number(usdAmount) <= 0) ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
                >
                  {creating ? 'Processing…' : (usdAmount && Number(usdAmount) > 0 ? `Confirm ${fmtUsd(Number(usdAmount))}` : 'Enter Amount')}
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
