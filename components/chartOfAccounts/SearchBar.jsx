import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function SearchBar({ searchTerm, onSearch }) {
  return (
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search accounts..."
        className="w-full md:max-w-sm"
      />
  );
}