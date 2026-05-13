import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Abinish Jha | Full Stack Web & AI Developer",
  description: "Abinish Jha - Full Stack Web & AI Developer specializing in React, Next.js, AI/ML integration, and modern web applications. Available for freelance projects.",
  keywords: ["web developer", "full stack developer", "React", "Next.js", "freelance", "AI", "LangChain", "Abinish", "Abinash", "Avinish", "Abinish Jha", "Abi", "Abhi", "Abi Jha", "Abhi Jha"],
  authors: [{ name: "Abinish Jha" }],
  openGraph: {
    title: "Abinish Jha | Full Stack Web Developer",
    description: "Full Stack Web Developer specializing in modern web applications and AI integration.",
    type: "website",
    url: "https://www.abinish.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD for explicit name variation indexing by Google
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Abinish Jha",
    "alternateName": ["Abinash Jha", "Avinish Jha", "Abinish", "Abinash", "Avinish", "Abi", "Abhi", "Abi Jha", "Abhi Jha"],
    "url": "https://www.abinish.com",
    "jobTitle": "Full Stack Web & AI Developer",
    "sameAs": [
      "https://github.com/abinishjha1",
      "https://www.linkedin.com/in/abinish-jha-2a0894192/"
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
