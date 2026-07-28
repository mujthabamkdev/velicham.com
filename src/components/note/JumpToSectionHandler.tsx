"use client";

import { useEffect } from "react";

export default function JumpToSectionHandler() {
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const targetText = decodeURIComponent(hash.slice(1)).trim();
      if (!targetText) return;

      setTimeout(() => {
        const allElements = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, a, p, li, span, div")
        );
        const match = allElements.find((el) => {
          const text = el.textContent || "";
          return (
            el.getAttribute("data-concept") === targetText ||
            el.getAttribute("data-heading") === targetText ||
            text.includes(targetText)
          );
        });

        if (match) {
          match.scrollIntoView({ behavior: "smooth", block: "center" });
          match.classList.add(
            "ring-4",
            "ring-cyan-400",
            "bg-cyan-500/20",
            "rounded-xl",
            "transition-all",
            "duration-500"
          );
          setTimeout(() => {
            match.classList.remove("ring-4", "ring-cyan-400", "bg-cyan-500/20");
          }, 3500);
        }
      }, 400);
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

  return null;
}
