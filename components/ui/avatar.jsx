import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative h-10 w-10 rounded-full bg-gray-200 overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function AvatarImage({ src, alt, className, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover h-full w-full", className)}
      {...props}
    />
  );
}

export function AvatarFallback({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-full w-full text-sm font-medium text-gray-600 bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}