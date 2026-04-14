"use client";

import { useState } from "react";
import LandingPage from "../components/LandingPage";
import StrataDashboard from "../components/StrataDashboard";

export default function Home() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  return <StrataDashboard onBack={() => setEntered(false)} />;
}
