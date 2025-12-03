'use client'; 

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * next-authのSessionProviderをラップしたクライアントコンポーネント。
 * RootLayoutで利用するために作成します。
 */
interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}