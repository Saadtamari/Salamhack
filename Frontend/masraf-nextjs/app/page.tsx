"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LoginPage } from "@/components/LoginPage";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

const MasrafApp        = dynamic(() => import("@/components/MasrafApp"),        { ssr: false });
const MasrafDesktopApp = dynamic(() => import("@/components/MasrafDesktopApp"), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setHydrated(true);

    function onLogout() {
      setUser(null);
    }
    window.addEventListener("masraf:logout", onLogout);
    return () => window.removeEventListener("masraf:logout", onLogout);
  }, []);

  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F3D29",
          color: "#F0C542",
          fontFamily: "var(--font-ar), sans-serif",
          fontWeight: 800,
        }}
      >
        ...
      </div>
    );
  }

  if (!user) {
    return <LoginPage onAuth={(authedUser) => setUser(authedUser)} />;
  }

  return (
    <>
      <div className="mobile-view">
        <MasrafApp />
      </div>
      <div className="desktop-view">
        <MasrafDesktopApp />
      </div>
      <style>{`
        body { margin: 0; }
        .mobile-view {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0D3B0F 0%, #1B5E20 52%, #FAFAF8 52%);
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .desktop-view { display: none; height: 100vh; }
        @media (min-width: 900px) {
          .mobile-view  { display: none; }
          .desktop-view { display: block; }
        }
      `}</style>
    </>
  );
}
