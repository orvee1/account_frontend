"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems, permissions } from "@/services/navitems";
import { logout } from "@/services/auth";
import { getBestRouteMatch, normalizePath, routeMatches } from "@/utils/navigation";


const SidebarLink = ({ item, closeSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const visibleSubItems =
    item.subItems?.filter((sub) => permissions.includes(sub.permission)) || [];
  const activeSubItem = getBestRouteMatch(pathname, visibleSubItems);
  const activeSubItemPath = activeSubItem ? normalizePath(activeSubItem.path) : "";
  const isSubItemActive = Boolean(activeSubItem);

  const isActive = item.subItems
    ? routeMatches(pathname, item.path) || isSubItemActive
    : routeMatches(pathname, item.path);
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive && visibleSubItems.length > 0) {
      setIsOpen(true);
    }
  }, [isActive, visibleSubItems.length]);

  if (!permissions.includes(item.permission)) return null;

  const handleToggle = (e) => {
    if (item.subItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      router.push(item.path);
      if (closeSidebar) closeSidebar();
    }
  };

  return (
    <li className="mb-1">
      <Link
        href={item.path}
        onClick={handleToggle}
        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ease-in-out
           hover:bg-blue-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-gray-100
           ${
             isActive
               ? "bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-gray-100 font-semibold shadow-sm"
               : "text-gray-700 dark:text-gray-300"
           }`}
      >
        <div className="flex items-center">
          <item.icon
            className={`w-5 h-5 mr-3 flex-shrink-0 ${
              isActive ? "text-blue-600 dark:text-gray-100" : ""
            }`}
          />
          <span className="text-sm">{item.name}</span>
        </div>
        {visibleSubItems.length > 0 &&
          (isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
      </Link>
      <AnimatePresence>
        {visibleSubItems.length > 0 && isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 mt-1 space-y-1 overflow-hidden"
          >
            {visibleSubItems.map((subItem) => (
              <li key={subItem.name}>
                <Link
                  href={subItem.path}
                  onClick={closeSidebar}
                  className={`flex items-center p-2 pl-5 rounded-md text-xs transition-colors duration-200
                    hover:bg-blue-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-gray-100
                    ${
                      activeSubItemPath === normalizePath(subItem.path)
                        ? "bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-gray-100 font-medium"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  {subItem.icon && (
                    <subItem.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  )}
                  {subItem.name}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};

const Sidebar = ({
  sidebarOpen = false,
  toggleSidebar = () => {},
  closeSidebar = () => {},
}) => {
    const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <motion.div
      animate={{ x: sidebarOpen ? 0 : "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`${ sidebarOpen ? "md:static w-64 overflow-hidden" : ""} fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-xl 
                             md:translate-x-0 md:shadow-lg border-r border-gray-200 dark:border-gray-700`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-blue-600 dark:bg-gray-800 text-white dark:text-gray-100">
          <Link href="/" className="flex items-center" onClick={closeSidebar}>
            <Package size={28} className="mr-2 text-blue-300" />
            <span className="text-xl font-bold">Easy CloudBook</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-gray-700"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <SidebarLink
                key={item.name}
                item={item}
                closeSidebar={closeSidebar}
              />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            variant="ghost"
            className="w-full flex justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-gray-100"
            href="/settings"
          >
            <Settings size={20} className="mr-3" /> Settings
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-gray-100"
            onClick={handleLogout}
          >
            <LogOut size={20} className="mr-3" /> Logout
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
