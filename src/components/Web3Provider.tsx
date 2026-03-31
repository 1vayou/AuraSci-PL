'use client';

import dynamic from 'next/dynamic';

const Web3ProviderInner = dynamic(() => import('./Web3ProviderInner'), { ssr: false });

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return <Web3ProviderInner>{children}</Web3ProviderInner>;
}
