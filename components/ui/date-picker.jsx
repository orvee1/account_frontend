import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  date,
  setDate,
  className,
  disabled,
  placeholder = "Pick a date",
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectDate = (selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    } else {
      setDate(undefined);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-white text-black dark:bg-slate-800 dark:text-white border dark:border-slate-600",
            !date && "text-muted-foreground dark:text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-50 bg-white text-black dark:bg-slate-800 dark:text-white border dark:border-slate-600"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        onInteractOutside={(e) => {
          if (e.target.closest('[role="grid"]')) {
            e.preventDefault();
          }
        }}
        style={{ pointerEvents: "auto" }}
      >
        <div
          style={{ pointerEvents: "auto" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              handleSelectDate(selectedDate);
              setTimeout(() => setIsOpen(false), 100);
            }}
            disabled={disabled}
            initialFocus
            className="rounded-md border border-border dark:border-slate-700 bg-white text-black dark:bg-slate-800 dark:text-white"
            classNames={{
              caption:
                "text-center text-sm font-medium text-primary dark:text-white",
              nav: "flex items-center justify-between px-2",
              nav_button:
                "h-8 w-8 bg-muted dark:bg-slate-700 text-foreground dark:text-white hover:bg-accent dark:hover:bg-slate-600",
              head_row:
                "flex justify-between text-xs font-semibold text-muted-foreground dark:text-slate-400",
              row: "flex w-full mt-1",
              cell: "h-9 w-9 text-center text-sm p-0 relative",
              day: "h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              day_selected:
                "bg-primary text-white hover:bg-primary/90 focus:bg-primary/90",
              day_today: "border border-blue-500 dark:border-blue-300",
              day_outside: "text-muted-foreground opacity-40",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
