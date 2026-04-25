import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./layoutWrapper"; // New wrapper component
import { AuthProvider } from "../context/AuthContext";
// import { Toaster } from "@/components/ui/sonner"
import toast, { Toaster } from 'react-hot-toast';

import StoreProvider from "./redux";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workspace_Webtech",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider> {/* Wrap everything with StoreProvider */}
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster/>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}


