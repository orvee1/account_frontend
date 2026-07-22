'use client';
import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center space-y-4">
        <Spinner />
        <p>Loading...</p>
      </div>
    </div>
  );
}
