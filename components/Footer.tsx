"use client";
import Link from "next/link";
import { Instagram, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        
        {/* Newsletter */}
        <div>
          <h3 className="text-xl font-bold mb-4">Subscribe to our Newsletter</h3>
          <p className="text-gray-400 mb-4">
            Get the latest updates, news, and crypto insights.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 p-3 rounded-l-2xl bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-500 hover:bg-blue-600 px-6 rounded-r-2xl transition-colors">
              Subscribe
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-400">

          <ul className="flex flex-col space-y-4">
          <li>
            <Link href="/about" className="hover:text-white transition-colors cursor-pointer">
              About Us
            </Link>
          </li>
          <li>
            <Link href="/features" className="hover:text-white transition-colors cursor-pointer">
              Features
            </Link>
          </li>
          <li>
            <Link href="/stats" className="hover:text-white transition-colors cursor-pointer">
              Live Stats
            </Link>
          </li>
          <li>
            <Link href="/faq" className="hover:text-white transition-colors cursor-pointer">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-white transition-colors cursor-pointer">
              Contact
            </Link>
          </li>
        </ul>

          </ul>
        </div>

        {/* Contact / Social */}
        <div>
          <h3 className="text-xl font-bold mb-4">Contact & Social</h3>
          <p className="text-gray-400 mb-4">
            Email: <span className="text-white">support@crypto-site.com</span>
          </p>
          <div className="flex gap-4">
            <a href="https://x.com/" className="hover:text-blue-400 transition-colors"><Twitter /></a>
            <a href="https://www.instagram.com/" className="hover:text-pink-500 transition-colors"><Instagram /></a>
            <a href="https://www.linkedin.com/" className="hover:text-blue-600 transition-colors"><Linkedin /></a>
            <a href="https://github.com/" className="hover:text-gray-400 transition-colors"><Github /></a>
          </div>
        </div>

      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        &copy; 2018 - {new Date().getFullYear()} CryptoCompass All rights reserved.
      </div>
    </footer>
  );
}
