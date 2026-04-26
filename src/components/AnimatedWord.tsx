"use client";

import { useState, useEffect } from "react";

const words = ["scholarship", "opportunity", "future", "grant", "dream"];
const STAGGER_MS = 40;

export default function AnimatedWord() {
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setExiting(false);
      }, 220);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const word = words[index];

  return (
    <span
      aria-label={word}
      className="italic text-blue-600"
      style={{
        fontFamily: "var(--font-instrument-serif)",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 200ms ease" : "none",
      }}
    >
      {word.split("").map((char, i) => (
        <span
          key={`${index}-${i}`}
          aria-hidden="true"
          style={{
            display: "inline-block",
            animationName: "letter-in",
            animationDuration: "400ms",
            animationTimingFunction: "ease",
            animationDelay: `${i * STAGGER_MS}ms`,
            animationFillMode: "both",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
