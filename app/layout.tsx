import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '테이블로그 | 보드게임 스코어보드', description: '게임별 점수와 순위, 플레이어별 판수·등수·시간 통계.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
