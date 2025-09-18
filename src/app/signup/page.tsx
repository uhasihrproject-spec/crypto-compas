"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/src/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();

  // --- Form State ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Firebase Email/Password Signup ---
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // update displayName
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        createdAt: serverTimestamp(),
      });

      console.log("Signed up:", user.email);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Google Signup ---
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user: User = result.user;

      // If user doesn’t already have displayName, fallback to saved form names
      await updateProfile(user, {
        displayName: user.displayName || `${firstName} ${lastName}`,
      });

      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName || user.displayName?.split(" ")[0] || "",
        lastName: lastName || user.displayName?.split(" ")[1] || "",
        email: user.email,
        createdAt: serverTimestamp(),
      });

      console.log("Google signup success:", user.email);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Signup Container */}
      <div className="flex flex-col md:flex-row flex-1 items-stretch justify-center w-full max-w-6xl mx-auto p-4 gap-6 animate-fadeIn">
        {/* Left Side - Signup Form */}
        <div className="flex-1 p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
          <Link
            href="/"
            className="absolute top-4 right-4 px-4 py-2 bg-white/15 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-white/25 hover:scale-105 transition"
          >
            Home
          </Link>

          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Sign Up
          </h2>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-5 py-3 bg-white/20 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-5 py-3 bg-white/20 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 bg-white/20 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 bg-white/20 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold hover:scale-105 transform transition"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 mt-4 py-3 bg-white/20 rounded-2xl text-white font-medium hover:bg-white/30 transition"
          >
            Sign up with Google
          </button>

          <p className="text-center text-sm text-white/70 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Log In
            </Link>
          </p>
        </div>

        {/* Right Side - Welcome Message */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl md:mt-0 md:ml-6 min-h-[500px] md:min-h-auto relative overflow-hidden backdrop-blur-sm animate-slideIn">
          <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl animate-floating"></div>
          <h2 className="text-4xl font-bold text-white mb-4 text-center z-10 relative">
            Welcome to CryptoCompass!
          </h2>
          <p className="text-white/80 text-center z-10 relative">
            Join the community to track live crypto prices, manage your
            portfolio, and interact with the crypto world.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center mt-auto text-white/50 text-sm relative">
        <div className="h-1 w-24 mx-auto mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full" />
        © 2018 - {new Date().getFullYear()} CryptoCompass. All rights reserved.
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes floating {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
        .animate-slideIn {
          animation: slideIn 1s ease forwards;
        }
        .animate-floating {
          animation: floating 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
