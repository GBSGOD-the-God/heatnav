import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Studentify AI — Learn Smarter. Not Harder.",
    template: "%s · Studentify AI",
  },
  description:
    "Studentify is an AI-powered learning platform for school students — a personal tutor available 24/7. Ask doubts, upload notes, generate flashcards and quizzes, plan your studies and track progress in one place.",
  keywords: [
    "AI tutor",
    "study app",
    "flashcards",
    "quiz generator",
    "study planner",
    "students",
  ],
  openGraph: {
    title: "Studentify AI — Learn Smarter. Not Harder.",
    description:
      "An AI-powered learning platform built for school students. Understanding before answers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05050a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
