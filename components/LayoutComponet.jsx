"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "./Sidebar";
import { navItems } from "@/services/navitems";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import { getCurrentPageName, normalizePath } from "@/utils/navigation";

const LayoutComponet = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };


  const pathname = normalizePath(usePathname());
  const currentPageName = getCurrentPageName(pathname, [
    ...navItems,
    { name: "Settings", path: "/settings" },
  ]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar {...{ sidebarOpen, toggleSidebar, closeSidebar }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header {...{ toggleSidebar, currentPageName }} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial="page-enter"
              animate="page-enter-active"
              exit="page-exit-active"
              variants={{
                "page-enter": { opacity: 0, y: 20, scale: 0.98 },
                "page-enter-active": {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.3, ease: "easeOut" },
                },
                "page-exit-active": {
                  opacity: 0,
                  y: -20,
                  scale: 0.98,
                  transition: { duration: 0.2, ease: "easeIn" },
                },
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default LayoutComponet;
