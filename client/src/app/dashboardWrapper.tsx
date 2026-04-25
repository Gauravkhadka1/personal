"use client"

import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAppSelector } from "./redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });

  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />
      <main
        className={`flex w-full flex-col bg-gray-50 dark:bg-dark-bg ${
          isSidebarCollapsed ? "" : "md:pl-64"
        }`}
      >
        {/* Make Navbar sticky */}
        <div className="sticky top-0 z-10">
          <Navbar />
        </div>
        {/* Content area with scrolling */}
        <div className="flex-1 overflow-auto pb-4">
          {children}
        </div>
        {/* Footer */}
        <footer className=" bg-white dark:bg-secondary border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="container mx-auto">
            <p>© {currentYear} Webtech Nepal. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default DashboardWrapper;