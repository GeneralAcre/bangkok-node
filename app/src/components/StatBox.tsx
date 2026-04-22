"use client";

import { useCounter } from "../hooks/useCounter";

export function StatBox({ target, label, loaded }: { target: number; label: string; loaded: boolean }) {
  const val = useCounter(loaded ? target : 0);
  return (
    <div className="stat-box">
      {!loaded ? (
        <div className="stat-shimmer" />
      ) : (
        <div className="stat-val">{val}</div>
      )}
      <div className="stat-lbl">{label}</div>
    </div>
  );
}
