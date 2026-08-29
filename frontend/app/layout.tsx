import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse AI - Interactive Knowledge Graphs",
  description: "Transform passive reading into active learning with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS CDN - Instant styling for the hackathon */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: 'class',
          }
        `}} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}