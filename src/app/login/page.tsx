"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/src/firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup, User } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Animated circles background ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let circles: { x: number; y: number; radius: number; dx: number; dy: number; color: string; }[] = [];
    const numCircles = 50;
    const colors = ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.25)"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      circles = [];
      for (let i = 0; i < numCircles; i++) {
        const radius = Math.random() * 50 + 30;
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      circles.forEach(c => {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius);
        gradient.addColorStop(0, c.color);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.dx;
        c.y += c.dy;
        if (c.x < -c.radius || c.x > canvas.width + c.radius) c.dx = -c.dx;
        if (c.y < -c.radius || c.y > canvas.height + c.radius) c.dy = -c.dy;
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // --- Firebase login ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user: User = userCredential.user;
      console.log("Logged in:", user.email);
      router.push("/"); // redirect to homepage
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user: User = result.user;
      console.log("Google login success:", user.email);
      router.push("/"); // redirect to homepage
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black overflow-hidden">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-20" />

      <div className="flex flex-col md:flex-row flex-1 items-stretch justify-center w-full max-w-6xl mx-auto p-4 gap-6 animate-fadeIn">
        {/* Left: Login Form */}
        <div className="flex-1 p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
          <Link
            href="/"
            className="absolute top-4 right-4 px-4 py-2 bg-white/15 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-white/25 hover:scale-105 transition"
          >
            Home
          </Link>

          <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
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
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 mt-4 py-3 bg-white/20 rounded-2xl text-white font-medium hover:bg-white/30 transition"
          >
            Login with Google
          </button>

          <p className="text-center text-sm text-white/70 mt-5">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Right: Welcome */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl md:mt-0 md:ml-6 min-h-[500px] md:min-h-auto relative overflow-hidden backdrop-blur-sm animate-slideIn">
          <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl animate-floating"></div>
          <h2 className="text-4xl font-bold text-white mb-4 text-center z-10 relative">Welcome Back!</h2>
          <p className="text-white/80 text-center z-10 relative">
            Log in to track your crypto portfolio, monitor live prices, and connect with the crypto community.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center mt-auto text-white/50 text-sm relative">
        <div className="h-1 w-24 mx-auto mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full" />
        © 2018 - {new Date().getFullYear()} CryptoCompass. All rights reserved.
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-fadeIn { animation: fadeIn 1s ease forwards; }
        .animate-slideIn { animation: slideIn 1s ease forwards; }
        .animate-floating { animation: floating 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
