import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "The Lenny Growth Assistant | AI Product & Growth Advisor",
  description:
    "An AI product and growth assistant grounded on Lenny Rachitsky's podcast interviews, playbooks, and frameworks with dedicated Ship 30 for 30 essay generation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
