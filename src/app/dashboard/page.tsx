
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/src/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  FaSpinner,
  FaBitcoin,
  FaEthereum,
  FaPlus,
  FaTrash,
  FaEye,
  FaSync,
} from "react-icons/fa";
import { SiSolana } from "react-icons/si";
import { BiError } from "react-icons/bi";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

type BlockchainAccount = {
  id: string;
  blockchain?: string;
  address?: string;
  balance?: string;
  balanceUSD?: string;
  lastTransactions?: Transaction[];
  isLoading?: boolean;
  error?: string;
  firestoreId?: string;
};

type Transaction = {
  hash: string;
  amount: string;
  type: "sent" | "received";
  timestamp: string;
  from?: string;
  to?: string;
};

type PortfolioTotals = {
  bitcoin: number;
  ethereum: number;
  solana: number;
  totalUSD: number;
};

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// Enhanced Blockchain API service
class BlockchainAPI {
  static async getBitcoinData(address: string) {
    try {
      const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}?limit=5`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const balance = (data.balance || 0) / 100000000;
      const transactions: Transaction[] = (data.txrefs || []).slice(0, 5).map((tx: any) => ({
        hash: tx.tx_hash.substring(0, 16) + "...",
        amount: (tx.value / 100000000).toFixed(8),
        type: tx.tx_output_n === -1 ? "sent" : "received",
        timestamp: new Date(tx.confirmed).toLocaleDateString(),
      }));

      return { balance: balance.toFixed(8), transactions };
    } catch (error) {
      console.error("Bitcoin API Error:", error);
      throw new Error("Failed to fetch Bitcoin data. Please try again.");
    }
  }

  static async getEthereumData(address: string) {
    try {
      // Mock data for demo
      const balance = (Math.random() * 10).toFixed(6);
      const transactions: Transaction[] = [
        {
          hash: "0x1234...5678",
          amount: "0.5",
          type: "received",
          timestamp: new Date().toLocaleDateString(),
        },
      ];
      return { balance, transactions };
    } catch (error) {
      console.error("Ethereum API Error:", error);
      throw new Error("Failed to fetch Ethereum data. Please try again.");
    }
  }

  static async getSolanaData(address: string) {
    try {
      const response = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address],
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "Solana API error");

      const balance = (data.result?.value || 0) / Math.pow(10, 9);
      return { balance: balance.toFixed(6), transactions: [] };
    } catch (error) {
      console.error("Solana API Error:", error);
      throw new Error("Failed to fetch Solana data. Please try again.");
    }
  }

  static async getCryptoPrices() {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return {
        bitcoin: data.bitcoin?.usd || 0,
        ethereum: data.ethereum?.usd || 0,
        solana: data.solana?.usd || 0,
      };
    } catch (error) {
      console.error("Price API Error:", error);
      return { bitcoin: 0, ethereum: 0, solana: 0 };
    }
  }
}

// Address validation
const validateAddress = {
  bitcoin: (address: string): boolean => {
    const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return btcRegex.test(address);
  },
  ethereum: (address: string): boolean => {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  },
  solana: (address: string): boolean => {
    const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solRegex.test(address);
  },
};

// Animation variants (typed)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// Background states for totals hover
const backgrounds: Record<string, string> = {
  default: "linear-gradient(135deg, #0f172a, #1a1a1a)",
  btc: "linear-gradient(135deg, #f7931a, #1a1a1a)",
  eth: "linear-gradient(135deg, #627eea, #1a1a1a)",
  sol: "linear-gradient(135deg, #9945FF, #1a1a1a)",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<BlockchainAccount[]>([]);
  const [newBlockchain, setNewBlockchain] = useState<string>("Bitcoin");
  const [newAddress, setNewAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [portfolioTotals, setPortfolioTotals] = useState<PortfolioTotals>({
    bitcoin: 0,
    ethereum: 0,
    solana: 0,
    totalUSD: 0,
  });
  const [cryptoPrices, setCryptoPrices] = useState({ bitcoin: 0, ethereum: 0, solana: 0 });
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [portfolioDropdownOpen, setPortfolioDropdownOpen] = useState(false);
  const [hoverBg, setHoverBg] = useState("default");
  const router = useRouter();

  // Notification system
  const addNotification = useCallback((type: NotificationType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, message, duration };

    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/");
      }
    });
    return unsubscribe;
  }, [router]);

  // Fetch crypto prices
  const fetchCryptoPrices = useCallback(async () => {
    setRefreshingPrices(true);
    try {
      const prices = await BlockchainAPI.getCryptoPrices();
      setCryptoPrices(prices);
    } catch (error) {
      addNotification("error", "Failed to fetch crypto prices");
    } finally {
      setRefreshingPrices(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchCryptoPrices();
    const priceInterval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(priceInterval);
  }, [fetchCryptoPrices]);

  // Persist accounts to localStorage (load on mount)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("accounts");
      if (saved) {
        const parsed = JSON.parse(saved) as BlockchainAccount[];
        // basic validation
        if (Array.isArray(parsed)) setAccounts(parsed);
      }
    } catch (e) {
      console.warn("Failed to load accounts from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("accounts", JSON.stringify(accounts));
    } catch (e) {
      console.warn("Failed to save accounts to localStorage", e);
    }
  }, [accounts]);

  // Helper functions
  const getBlockchainIcon = (blockchain?: string | null) => {
    if (!blockchain || typeof blockchain !== "string") {
      return <span className="text-gray-400">🔗</span>;
    }

    switch (blockchain.toLowerCase()) {
      case "bitcoin":
        return <FaBitcoin className="text-orange-400" />;
      case "ethereum":
        return <FaEthereum className="text-blue-400" />;
      case "solana":
        return <SiSolana className="text-purple-400" />;
      default:
        return <span className="text-gray-400">🔗</span>;
    }
  };

  const getBlockchainSymbol = (blockchain?: string | null) => {
    if (!blockchain || typeof blockchain !== "string") return "TOKEN";

    switch (blockchain.toLowerCase()) {
      case "bitcoin":
        return "BTC";
      case "ethereum":
        return "ETH";
      case "solana":
        return "SOL";
      default:
        return blockchain.toUpperCase().substring(0, 4);
    }
  };

  // Fetch blockchain data for an account
  const fetchAccountData = async (account: BlockchainAccount) => {
    if (!account?.blockchain || !account?.address || !account?.id) {
      console.error("Invalid account data:", account);
      return;
    }

    setAccounts((prev) => prev.map((acc) => (acc.id === account.id ? { ...acc, isLoading: true, error: undefined } : acc)));

    try {
      let data;
      const blockchain = account.blockchain.toLowerCase();

      switch (blockchain) {
        case "bitcoin":
          data = await BlockchainAPI.getBitcoinData(account.address);
          break;
        case "ethereum":
          data = await BlockchainAPI.getEthereumData(account.address);
          break;
        case "solana":
          data = await BlockchainAPI.getSolanaData(account.address);
          break;
        default:
          throw new Error("Unsupported blockchain");
      }

      const priceKey = blockchain as keyof typeof cryptoPrices;
      const currentPrice = cryptoPrices[priceKey] || 0;
      const balanceUSD = (parseFloat(data.balance) * currentPrice).toFixed(2);

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id
            ? {
                ...acc,
                balance: data.balance,
                balanceUSD,
                lastTransactions: data.transactions,
                isLoading: false,
                error: undefined,
              }
            : acc
        )
      );

      addNotification("success", `Updated ${blockchain} balance: ${data.balance}`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === account.id ? { ...acc, isLoading: false, error: errorMessage } : acc))
      );
      addNotification("error", `Failed to update ${account.blockchain}: ${errorMessage}`);
    }
  };

  // Calculate portfolio totals
  useEffect(() => {
    const totals = accounts.reduce(
      (acc, account) => {
        if (account?.balance && !account.error && account.blockchain && typeof account.blockchain === "string") {
          const balance = parseFloat(account.balance) || 0;
          const blockchain = account.blockchain.toLowerCase();

          if (blockchain === "bitcoin") acc.bitcoin += balance;
          else if (blockchain === "ethereum") acc.ethereum += balance;
          else if (blockchain === "solana") acc.solana += balance;
        }
        return acc;
      },
      { bitcoin: 0, ethereum: 0, solana: 0, totalUSD: 0 }
    );

    totals.totalUSD =
      totals.bitcoin * (cryptoPrices.bitcoin || 0) +
      totals.ethereum * (cryptoPrices.ethereum || 0) +
      totals.solana * (cryptoPrices.solana || 0);

    setPortfolioTotals(totals);
  }, [accounts, cryptoPrices]);

  // Fetch accounts from backend (if user logged in)
  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/getLinkedAccounts?userId=${user.uid}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      let accountsArray: BlockchainAccount[] = [];

      if (Array.isArray(data)) {
        accountsArray = data.filter((account) => account && account.id);
      } else if (data && typeof data === "object" && data.id) {
        accountsArray = [data];
      }

      setAccounts(accountsArray);

      for (const account of accountsArray) {
        if (account && account.blockchain && account.address) {
          fetchAccountData(account);
        }
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      addNotification("error", "Failed to fetch accounts. Please refresh the page.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
  }, [user, fetchAccounts]);

  // Add new account
  const handleAddAccount = async () => {
    if (!user || !newAddress.trim()) {
      addNotification("warning", "Please enter a valid address");
      return;
    }

    const trimmedAddress = newAddress.trim();
    const blockchainLower = newBlockchain.toLowerCase();

    if (!validateAddress[blockchainLower as keyof typeof validateAddress]) {
      addNotification("error", "Unsupported blockchain selected");
      return;
    }

    if (!validateAddress[blockchainLower as keyof typeof validateAddress](trimmedAddress)) {
      addNotification("error", `Invalid ${newBlockchain} address format`);
      return;
    }

    const isDuplicate = accounts.some((acc) => acc.address === trimmedAddress && acc.blockchain?.toLowerCase() === blockchainLower);

    if (isDuplicate) {
      addNotification("warning", "This address is already added to your portfolio");
      return;
    }

    setAddingAccount(true);

    try {
      const res = await fetch("/api/addLinkedAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          blockchain: newBlockchain,
          address: trimmedAddress,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const addedAccount = await res.json();

      if (addedAccount && addedAccount.id) {
        setAccounts((prev) => [...prev, addedAccount]);
        setNewAddress("");
        addNotification("success", `${newBlockchain} address added successfully!`);

        if (addedAccount.blockchain && addedAccount.address) {
          setTimeout(() => fetchAccountData(addedAccount), 500);
        }
      }
    } catch (err) {
      console.error("Error adding account:", err);
      addNotification("error", `Failed to add account: ${(err as Error).message}`);
    } finally {
      setAddingAccount(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async (account: BlockchainAccount) => {
    if (!user || !account.firestoreId) return;

    if (!confirm(`Are you sure you want to remove this ${account.blockchain} address?`)) {
      return;
    }

    try {
      const res = await fetch("/api/deleteLinkedAccount", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.firestoreId,
          userId: user.uid,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
      addNotification("success", `${account.blockchain} address removed successfully`);
    } catch (err) {
      console.error("Error deleting account:", err);
      addNotification("error", "Failed to remove address");
    }
  };

  // Notification component
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`p-4 rounded-lg shadow-lg backdrop-blur-md border max-w-sm ${
              notification.type === "success"
                ? "bg-green-500/20 border-green-400/50 text-green-100"
                : notification.type === "error"
                ? "bg-red-500/20 border-red-400/50 text-red-100"
                : notification.type === "warning"
                ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-100"
                : "bg-blue-500/20 border-blue-400/50 text-blue-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{notification.message}</span>
              <button onClick={() => removeNotification(notification.id)} className="ml-2 text-white/70 hover:text-white">
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <NotificationContainer />
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-center pt-20 sm:pt-24">
        {/* Floating circles */}
        {[
          { color: "bg-purple-500/30", width: 80, height: 30, x: -250, y: -120, duration: 20 },
          { color: "bg-blue-400/25", width: 100, height: 20, x: 200, y: -150, duration: 18 },
          { color: "bg-pink-500/20", width: 120, height: 40, x: -220, y: 220, duration: 22 },
          { color: "bg-green-400/20", width: 60, height: 25, x: 250, y: 180, duration: 16 },
        ].map((circle, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${circle.color}`}
            style={{ width: `${circle.width}px`, height: `${circle.height}px` }}
            initial={{ x: circle.x, y: circle.y }}
            animate={{
              x: [circle.x, circle.x * -0.3, circle.x],
              y: [circle.y, circle.y * -0.3, circle.y],
            }}
            transition={{
              duration: circle.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        ))}

        <motion.div
          className="absolute inset-0"
          aria-hidden
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          animate={{ background: hoverBg === "btc" ? "linear-gradient(135deg, rgba(247,147,26,0.12), rgba(0,0,0,0.7))" : hoverBg === "eth" ? "linear-gradient(135deg, rgba(98,126,234,0.12), rgba(0,0,0,0.7))" : hoverBg === "sol" ? "linear-gradient(135deg, rgba(153,69,255,0.12), rgba(0,0,0,0.7))" : "rgba(0,0,0,0.7)" }}
          transition={{ duration: 0.6 }}
        />

        <motion.div className="relative z-10 max-w-5xl px-6 flex flex-col items-center justify-center" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1
            className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-6 
                      bg-clip-text text-transparent bg-gradient-to-r 
                      from-blue-400 via-purple-400 to-pink-400"
            variants={itemVariants}
          >
            {user?.displayName
              ? `${user.displayName.split(" ")[0]}'s Portfolio`
              : "Your Crypto Portfolio"}
          </motion.h1>

          {/* Portfolio Dropdown */}
          <motion.div className="relative mb-12" variants={itemVariants}>
            <div className="group relative">
              <motion.button
                className="px-5 py-3 sm:px-8 sm:py-4 
                          bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 
                          backdrop-blur-md rounded-2xl border border-green-400/30 
                          hover:border-green-400/50 transition-all duration-300 
                          shadow-lg hover:shadow-green-400/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPortfolioDropdownOpen(!portfolioDropdownOpen)}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.span
                    className="text-green-400 text-xl sm:text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💰
                  </motion.span>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">
                      Portfolio Value
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      ${portfolioTotals.totalUSD.toFixed(2)}
                    </p>
                  </div>
                  <motion.div
                    className="text-gray-400 ml-1 sm:ml-2"
                    animate={{
                      rotate: portfolioDropdownOpen ? 180 : 0,
                      y: portfolioDropdownOpen ? 0 : [0, -2, 0],
                    }}
                    transition={{
                      duration: portfolioDropdownOpen ? 0.3 : 1.5,
                      repeat: portfolioDropdownOpen ? 0 : Infinity,
                    }}
                  >
                    ▼
                  </motion.div>
                </div>
              </motion.button>

              {/* Dropdown Content */}
              <AnimatePresence>
                {portfolioDropdownOpen && (
                  <motion.div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-20" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                    <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 p-6 min-w-[350px] max-w-lg">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 border-t border-l border-white/10 rotate-45"></div>

                      <motion.h3 className="text-lg font-semibold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        Portfolio Breakdown
                      </motion.h3>

                      <div className="grid gap-4">
                        {/* Bitcoin */}
                        <motion.div
                          onMouseEnter={() => setHoverBg("btc")}
                          onMouseLeave={() => setHoverBg("default")}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-400/20 hover:border-orange-400/40 transition-all"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                              <FaBitcoin className="text-orange-400 text-xl" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-gray-300">Bitcoin</p>
                              <p className="text-xs text-gray-400">${cryptoPrices.bitcoin.toLocaleString()}/BTC</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{portfolioTotals.bitcoin.toFixed(8)} BTC</p>
                            <p className="text-sm text-orange-400">${(portfolioTotals.bitcoin * cryptoPrices.bitcoin).toFixed(2)}</p>
                          </div>
                        </motion.div>

                        {/* Ethereum */}
                        <motion.div
                          onMouseEnter={() => setHoverBg("eth")}
                          onMouseLeave={() => setHoverBg("default")}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                              <FaEthereum className="text-blue-400 text-xl" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-gray-300">Ethereum</p>
                              <p className="text-xs text-gray-400">${cryptoPrices.ethereum.toLocaleString()}/ETH</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{portfolioTotals.ethereum.toFixed(6)} ETH</p>
                            <p className="text-sm text-blue-400">${(portfolioTotals.ethereum * cryptoPrices.ethereum).toFixed(2)}</p>
                          </div>
                        </motion.div>

                        {/* Solana */}
                        <motion.div
                          onMouseEnter={() => setHoverBg("sol")}
                          onMouseLeave={() => setHoverBg("default")}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-all"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                              <SiSolana className="text-purple-400 text-xl" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-gray-300">Solana</p>
                              <p className="text-xs text-gray-400">${cryptoPrices.solana.toLocaleString()}/SOL</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{portfolioTotals.solana.toFixed(6)} SOL</p>
                            <p className="text-sm text-purple-400">${(portfolioTotals.solana * cryptoPrices.solana).toFixed(2)}</p>
                          </div>
                        </motion.div>

                        {/* Total Summary */}
                        <motion.div className="border-t border-white/10 pt-4 mt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                            <span className="font-semibold text-gray-300">Total Portfolio</span>
                            <motion.span className="font-bold text-2xl text-green-400" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                              ${portfolioTotals.totalUSD.toFixed(2)}
                            </motion.span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close dropdown overlay for mobile */}
            {portfolioDropdownOpen && <div className="fixed inset-0 z-10 lg:hidden" onClick={() => setPortfolioDropdownOpen(false)} />}
          </motion.div>

          <motion.p className="text-lg sm:text-xl text-gray-300 mb-12 max-w-2xl text-center" variants={itemVariants}>
            Link your blockchain addresses and track your portfolio in real-time with live market data and transaction history.
          </motion.p>

          {/* Add Account Form */}
          <motion.div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl justify-center items-center mb-8" variants={itemVariants}>
            <select value={newBlockchain} onChange={(e) => setNewBlockchain(e.target.value)} className="px-6 py-4 rounded-full bg-gray-900/80 text-white border-2 border-gray-700 hover:border-blue-400 focus:border-blue-400 transition-all outline-none backdrop-blur-md" disabled={addingAccount}>
              <option value="Bitcoin">Bitcoin</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Solana">Solana</option>
            </select>

            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder={`Enter ${newBlockchain} address`}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full px-6 py-4 rounded-full bg-gray-950/80 border-2 border-gray-700 focus:border-blue-400 text-white placeholder-white/60 focus:outline-none backdrop-blur-md transition-all"
                disabled={addingAccount}
                onKeyPress={(e) => e.key === "Enter" && handleAddAccount()}
              />
            </div>

            <motion.button
              onClick={handleAddAccount}
              disabled={!newAddress.trim() || addingAccount}
              className="px-8 py-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-semibold rounded-full hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-2 min-w-[120px] justify-center"
              whileHover={{ scale: !newAddress.trim() || addingAccount ? 1 : 1.05 }}
              whileTap={{ scale: !newAddress.trim() || addingAccount ? 1 : 0.95 }}
            >
              {addingAccount ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FaPlus />
                  Add
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Refresh Prices Button */}
          <motion.button
            onClick={fetchCryptoPrices}
            disabled={refreshingPrices}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 transition-all backdrop-blur-md border border-gray-600/50"
            whileHover={{ scale: refreshingPrices ? 1 : 1.05 }}
            whileTap={{ scale: refreshingPrices ? 1 : 0.95 }}
            variants={itemVariants}
          >
            <FaSync className={refreshingPrices ? "animate-spin" : ""} />
            {refreshingPrices ? "Updating..." : "Refresh Prices"}
          </motion.button>

          {/* Global Loading Indicator */}
          {loading && (
            <motion.div className="flex items-center justify-center mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FaSpinner className="animate-spin text-blue-400 text-3xl mr-3" />
              <span className="text-lg text-gray-400">Loading your portfolio...</span>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Accounts Section */}
      <section className="flex-1 px-6 sm:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Your Linked Addresses ({accounts.length})
          </motion.h2>

          <AnimatePresence mode="wait">
            {accounts.length === 0 && !loading ? (
              <motion.div key="no-accounts" className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.5 }}>
                <motion.div className="text-6xl mb-6" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}>
                  🔗
                </motion.div>
                <p className="text-xl text-white/70 mb-6">No addresses linked yet</p>
                <p className="text-gray-400 mb-8 text-center max-w-md">Add your first cryptocurrency address to start tracking your portfolio in real-time.</p>
                <motion.button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-8 py-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Link Your First Address
                </motion.button>
              </motion.div>
            ) : (
              <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants} initial="hidden" animate="visible">
                {accounts.map((acc, index) => {
                  if (!acc || !acc.id) return null;

                  return (
                    <motion.div key={acc.id} className="group" variants={itemVariants} layoutId={acc.id}>
                      <motion.div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300 h-full" initial={{ scale: 1, rotateY: 0 }} whileHover={{ scale: 1.02, rotateY: 5, transition: { duration: 0.3, type: "tween", ease: "easeOut" } }} style={{ transformStyle: "preserve-3d" }}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                              {getBlockchainIcon(acc.blockchain)}
                            </motion.div>
                            <div>
                              <h3 className="text-lg font-semibold">{acc.blockchain || "Unknown"}</h3>
                              <p className="text-xs text-gray-400">Added recently</p>
                            </div>
                          </div>

                          <motion.button onClick={() => handleDeleteAccount(acc)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <FaTrash className="text-sm" />
                          </motion.button>
                        </div>

                        {/* Address */}
                        <div className="mb-6">
                          <p className="text-xs text-gray-400 mb-2">Address:</p>
                          <Link href={acc.address ? `https://explorer.solana.com/address/${acc.address}` : "#"} target="_blank" className="text-sm text-white/80 break-all bg-gray-800/50 p-3 rounded-lg font-mono block hover:bg-gray-800/60 hover:text-green-300 transition-colors duration-200">
                            {acc.address || "No address"}
                          </Link>
                        </div>

                        {/* Loading State */}
                        {acc.isLoading && (
                          <motion.div className="flex items-center justify-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <FaSpinner className="animate-spin text-blue-400 text-2xl mr-3" />
                            <span className="text-sm text-gray-400">Fetching data...</span>
                          </motion.div>
                        )}

                        {/* Error State */}
                        {acc.error && (
                          <motion.div className="py-6" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-2 mb-3">
                              <BiError className="text-red-400" />
                              <span className="text-red-400 text-sm font-medium">Error</span>
                            </div>
                            <p className="text-red-300 text-sm mb-4">{acc.error}</p>
                            <motion.button onClick={() => fetchAccountData(acc)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <FaSync className="text-xs" />
                              Retry
                            </motion.button>
                          </motion.div>
                        )}

                        {/* Success State - Balance & Transactions */}
                        {!acc.isLoading && !acc.error && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            {/* Balance */}
                            <div className="mb-6">
                              <motion.div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20" whileHover={{ scale: 1.02 }}>
                                <p className="text-2xl font-bold text-white mb-1">
                                  {acc.balance || "0"} {getBlockchainSymbol(acc.blockchain)}
                                </p>
                                {acc.balanceUSD && <p className="text-lg text-gray-400">${acc.balanceUSD} USD</p>}
                                {!acc.balance && <p className="text-sm text-gray-500">Balance not loaded</p>}
                              </motion.div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="mb-6">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <span>Recent Transactions</span>
                                {acc.lastTransactions && acc.lastTransactions.length > 0 && <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">{acc.lastTransactions.length}</span>}
                              </h4>

                              {acc.lastTransactions && acc.lastTransactions.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                  {acc.lastTransactions.map((tx, i) => (
                                    <motion.div key={i} className="text-xs bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }}>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className={`font-medium ${tx.type === "received" ? "text-green-400" : "text-red-400"}`}>{tx.type === "received" ? "+" : "-"}
                                          {tx.amount}
                                        </span>
                                        <span className="text-gray-400">{tx.timestamp}</span>
                                      </div>
                                      <p className="text-gray-500 truncate">{tx.hash}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 text-center py-4 bg-gray-800/30 rounded-lg">No recent transactions</p>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-auto">
                          <Link href={`/dashboard/account/${acc.id}`} className="flex-1">
                            <motion.button className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <FaEye />
                              View Details
                            </motion.button>
                          </Link>

                          <motion.button onClick={() => fetchAccountData(acc)} className="px-4 py-3 bg-gray-600 text-white rounded-xl text-sm hover:bg-gray-700 transition-all" disabled={acc.isLoading} whileHover={{ scale: acc.isLoading ? 1 : 1.05 }} whileTap={{ scale: acc.isLoading ? 1 : 0.95 }}>
                            <FaSync className={acc.isLoading ? "animate-spin" : ""} />
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
      <ChatWidget />

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
