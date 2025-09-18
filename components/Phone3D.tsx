"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";

function Phone({ baseScale }: { baseScale: number }) {
  const phoneRef = useRef<any>(null);
  const gltf = useGLTF("/Phone.glb");

  const [mode, setMode] = useState<"spinning" | "zoomIn" | "showing" | "zoomOut">("spinning");
  const [scale, setScale] = useState(baseScale);
  const [zoomCycles, setZoomCycles] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  const zoomTarget = baseScale * 1.5;

  useFrame(() => {
    if (!phoneRef.current) return;
    const obj = phoneRef.current;

    if (mode === "spinning") {
      obj.rotation.y += 0.015;

      if (
        !cooldown &&
        Math.abs((obj.rotation.y % (2 * Math.PI)) - Math.PI / 2) < 0.08
      ) {
        setMode("zoomIn");
        setCooldown(true);
      }
    } else if (mode === "zoomIn") {
      if (scale < zoomTarget) {
        setScale(Math.min(scale + 0.025, zoomTarget));
      } else {
        setMode("showing");
        setTimeout(() => setMode("zoomOut"), 1500);
      }
    } else if (mode === "zoomOut") {
      if (scale > baseScale) {
        setScale(Math.max(scale - 0.025, baseScale));
      } else {
        setScale(baseScale);

        const newZoomCycles = zoomCycles + 1;
        setZoomCycles(newZoomCycles);

        if (newZoomCycles >= 2) {
          setZoomCycles(0);
          setTimeout(() => setCooldown(false), 2000);
        } else {
          setTimeout(() => setMode("zoomIn"), 500);
        }

        setMode("spinning");
      }
    }

    obj.scale.set(scale, scale, scale);
  });

  return <primitive ref={phoneRef} object={gltf.scene} position={[0, 0, 0]} />;
}

export default function PhoneHero() {
  const [baseScale, setBaseScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setBaseScale(0.5);
      else if (window.innerWidth < 1024) setBaseScale(0.8);
      else setBaseScale(1.2);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col sm:flex-row items-center justify-center px-2 sm:px-4 md:px-20 relative overflow-hidden bg-gray-950">
      {/* Left Text */}
      <div className="z-10 flex-1 max-w-xs sm:max-w-md text-white text-left pr-2 sm:pr-4 mb-6 sm:mb-0">
        <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-6 leading-tight">
          Experience Crypto at Your Fingertips
        </h1>
        <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-gray-300 mb-3 sm:mb-6">
          Manage, trade, and track all your digital assets in one sleek mobile
          app. Full control, full transparency.
        </p>
        <button className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-black font-semibold rounded-lg text-xs sm:text-base hover:scale-105 transition-transform">
          Coming Soon
        </button>
      </div>

      {/* Right Phone */}
      <div className="flex-1 h-[250px] sm:h-[350px] md:h-[500px] lg:h-[600px] relative flex items-center justify-center">
        <div className="absolute w-[60%] h-[60%] rounded-full bg-blue-400 opacity-20 blur-3xl z-0"></div>

        <Canvas className="w-full h-full z-10" camera={{ position: [0, 0, 8], fov: 40 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-5, -5, 5]} intensity={1} />

          <Phone baseScale={baseScale} />

          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>
    </div>
  );
}
