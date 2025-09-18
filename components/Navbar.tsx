"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/src/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
      alert("Logged out successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={`block py-2 px-4 rounded-lg transition-colors ${
        pathname === href ? "text-yellow-400 font-semibold" : "hover:text-yellow-400"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-black/30 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="flex justify-between items-center h-20 relative">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            CryptoCompass
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-4 text-white font-medium">
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/stats">Stats</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/faq">FAQ</NavLink>

            {!user ? (
              <>
                <NavLink href="/login">Login</NavLink>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:scale-105 transition-transform"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <motion.div
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 bg-[length:200%_200%] text-black font-semibold rounded-lg cursor-pointer border-2 border-green-400 shadow-lg"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.email?.split("@")[0]}
                </motion.div>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-black/40 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-4 z-50 flex flex-col space-y-2"
                    >
                      <p className="text-white font-semibold">{user.email?.split("@")[0]}</p>
                      <p className="text-white/70 text-sm break-all">{user.email}</p>

                      {/* New Backend-Ready Dashboard Link */}
                      <Link
                        href="/dashboard" // the new page where you'll work on the user’s linked address
                        className="w-full text-center py-2 bg-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
                      >
                        Go to Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none font-semibold px-3 py-3 text-lg rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20"
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden px-6 py-4 bg-black/30 backdrop-blur-lg border-t border-white/20 space-y-2 flex flex-col"
          >
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/stats">Stats</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/faq">FAQ</NavLink>

            {!user ? (
              <>
                <NavLink href="/login">Login</NavLink>
                <Link
                  href="/signup"
                  className="block px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:scale-105 transition-transform"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <motion.div
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-3 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 bg-[length:200%_200%] text-black font-semibold rounded-lg cursor-pointer border-2 border-green-400 shadow-lg"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.email?.split("@")[0]}
                </motion.div>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 w-full bg-black/40 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-4 flex flex-col space-y-2"
                    >
                      <p className="text-white font-semibold">{user.email?.split("@")[0]}</p>
                      <p className="text-white/70 text-sm break-all">{user.email}</p>

                      {/* New Backend-Ready Dashboard Link */}
                      <Link
                        href="/dashboard"
                        className="w-full text-center py-2 bg-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
                      >
                        Go to Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
