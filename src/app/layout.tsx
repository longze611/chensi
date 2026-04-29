import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thinking - 启发式想法迭代平台",
  description: "通过提问、建议与动态文档更新，让模糊想法逐渐清晰。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
