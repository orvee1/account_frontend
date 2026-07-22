"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ text = "Back", className = "" }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center px-4 py-2 text-sm rounded-md border border-border dark:border-dark-border text-muted-foreground hover:bg-muted/80 dark:hover:bg-dark-muted/50 transition-colors ${className}`}
    >
      <ArrowLeft size={16} className="mr-2" />
      {text}
    </button>
  );
}
