"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ModalWrapper = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "550px",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${maxWidth}
          max-h-[90vh] overflow-y-auto 
          bg-white dark:bg-slate-700 text-black dark:text-white 
          border border-border dark:border-slate-600 
          shadow-xl rounded-lg transition-all`}
      >
        <DialogHeader>
          <DialogTitle className="text-primary dark:text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground dark:text-slate-300">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalWrapper;
