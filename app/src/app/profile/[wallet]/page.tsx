"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileWalletRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/credentials"); }, [router]);
  return null;
}
