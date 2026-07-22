import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Send } from "lucide-react";

const SalesInvoiceFooter = ({ handleSaveInvoice }) => {
  return (
    <div className="bg-muted/30 dark:bg-dark-muted/30 rounded-b-lg p-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t  dark:border-dark-border">
      <Button
        variant="outline"
        className="w-full sm:w-auto shadow hover:shadow-md"
        onClick={() => {
          /* handle cancel */
        }}
      >
        Cancel
      </Button>
      <Button
        className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary-hover dark:bg-dark-secondary dark:text-dark-secondary-foreground dark:hover:bg-dark-secondary-hover flex items-center shadow hover:shadow-md"
        onClick={() => handleSaveInvoice(false)}
      >
        <Save size={18} className="mr-2" /> Save as Draft
      </Button>
      <Button
        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-hover dark:bg-dark-primary dark:text-dark-primary-foreground dark:hover:bg-dark-primary-hover flex items-center shadow hover:shadow-md"
        onClick={() => handleSaveInvoice(true)}
      >
        <Send size={18} className="mr-2" /> Save & Send
      </Button>
    </div>
  );
};

export default SalesInvoiceFooter;
