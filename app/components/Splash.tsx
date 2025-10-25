// app/components/Splash.tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./splash.module.css";

export default function Splash() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHide(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`${styles.splash} ${hide ? styles.hide : ""}`} aria-hidden>
      <div className={styles.logo}>
        <strong>CLUB</strong> <span>Solteros</span>
      </div>
    </div>
  );
}