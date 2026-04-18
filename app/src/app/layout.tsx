import type { Metadata } from "next";
import "./globals.css";
import { SolanaWalletProvider } from "../components/WalletProvider";

export const metadata: Metadata = {
  title: "Strata",
  description: "On-Chain Coordination OS for Builder Communities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
