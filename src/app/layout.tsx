import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '客户成功工作台',
  description: '天润融通客户成功管理平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
