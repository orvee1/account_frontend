import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "./ui/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useTopbar } from "@/contexts/TopbarContext";

const Header = ({ toggleSidebar, currentPageName }) => {
  const { toast } = useToast();
  const { rightContent } = useTopbar();

  return (
    <header className="min-h-20 bg-white dark:bg-gray-800 shadow-md flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex min-w-0 flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 shrink-0 text-gray-700 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-gray-700"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </Button>
        <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
          {currentPageName}
        </h1>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none">
        {rightContent && (
          <div className="min-w-[190px] max-w-full flex-1 sm:w-[280px] sm:flex-none lg:w-[340px]">
            {rightContent}
          </div>
        )}
        <LanguageSwitcher />
        <ThemeSwitcher />
        <div
          className="w-10 h-10 shrink-0 bg-blue-600 dark:bg-blue-600 rounded-full flex items-center justify-center text-white dark:text-gray-100 font-semibold cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-500"
          onClick={() =>
            toast({
              title: "User Profile",
              description: "User profile actions coming soon!",
            })
          }
        >
          U
        </div>
      </div>
    </header>
  );
};
export default Header;
