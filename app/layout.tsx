import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '테이블로그 — 우리의 플레이가 쌓이는 곳', description: '친구들과 함께 남기는 보드게임 기록, 게임별 리더보드와 플레이 통계.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
