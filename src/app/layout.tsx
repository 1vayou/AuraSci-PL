import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AuraSci — Proof to Capital',
  description: 'Milestone-based open science funding powered by AI Agents. ERC-8004 · ERC-8183 · x402 · IPFS/Storacha.',
  openGraph: {
    title: 'AuraSci — From Proof to Capital',
    description: 'AI-verified research funding on Protocol Labs infrastructure.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
