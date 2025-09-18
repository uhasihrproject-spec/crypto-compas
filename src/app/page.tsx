import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatWidget from "@/components/ChatWidget";
import LiveStats from "@/components/LiveStats";
import Pricing from "@/components/Pricing";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Phone3D from "@/components/Phone3D";
import CoinCalculator from "@/components/CoinCalculator";
export default function Home() {
  return (
    <main className="bg-gray-950 min-h-screen text-white">
      <Navbar />
      <Hero />
      <Phone3D />
      <Features />
      <Pricing /> 
      <LiveStats /> 
      <About />
      <Testimonials />
      <FAQ />
      <Footer />
      <ChatWidget />
      <CoinCalculator />
    </main>
  );
}
