"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LayoutComponet from "@/components/LayoutComponet";
import LoginPage from "@/components/LoginPage";
import { fetchProfileData } from "@/services/auth";
import Spinner from "./ui/Spinner";
import { SettingsProvider } from "@/contexts/settings-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { TopbarProvider } from "@/contexts/TopbarContext";

export default function ClientLayoutWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      setLoading(true);
      const data = await fetchProfileData();
      setUser(data?.user ?? null);
    } catch (error) {
      console.error("Auth error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white bg-gray-900">
        <div className="text-center space-y-4">
          <Spinner />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={loadUser} />;
  }

  return (
    <AuthProvider initialUser={user} initialLoading={false} skipFetch={true}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <SettingsProvider>
            <TopbarProvider>
              <LayoutComponet>{children}</LayoutComponet>
            </TopbarProvider>
          </SettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
