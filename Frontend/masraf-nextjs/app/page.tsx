"use client";
import dynamic from "next/dynamic";

const MasrafApp        = dynamic(() => import("@/components/MasrafApp"),        { ssr: false });
const MasrafDesktopApp = dynamic(() => import("@/components/MasrafDesktopApp"), { ssr: false });

export default function Home() {
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
          background: #11100e;
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
