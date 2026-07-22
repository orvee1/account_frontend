import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  PackagePlus as PackageIcon,
} from "lucide-react";

const SalesInvoiceHeader = ({
  saleType,
  handleSaleTypeChange,
  invoiceNumber,
  customer,
  setCustomer,
  initialCustomers,
  invoiceDate,
  setInvoiceDate,
  dueDate,
  setDueDate,
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary dark:text-dark-primary flex items-center">
          <PackageIcon
            size={32}
            className="mr-3 text-accent dark:text-dark-accent"
          />{" "}
          New Sales Invoice
        </h1>
        <div className="flex space-x-2">
          <Button
            variant={saleType === "cash" ? "default" : "outline"}
            onClick={() => handleSaleTypeChange("cash")}
            className={`flex items-center shadow-md transition-all duration-200 ${
              saleType === "cash"
                ? "bg-accent text-accent-foreground hover:bg-accent-hover dark:bg-dark-accent dark:text-dark-accent-foreground dark:hover:bg-dark-accent-hover"
                : "border-primary dark:border-dark-primary text-primary dark:text-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/10"
            }`}
          >
            <DollarSign size={18} className="mr-2" /> Cash Sale
          </Button>
          <Button
            variant={saleType === "credit" ? "default" : "outline"}
            onClick={() => handleSaleTypeChange("credit")}
            className={`flex items-center shadow-md transition-all duration-200 ${
              saleType === "credit"
                ? "bg-secondary text-secondary-foreground hover:bg-secondary-hover dark:bg-dark-secondary dark:text-dark-secondary-foreground dark:hover:bg-dark-secondary-hover"
                : "border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 dark:hover:bg-dark-secondary/10"
            }`}
          >
            <CreditCard size={18} className="mr-2" /> Credit Sale
          </Button>
        </div>
      </div>

      <div className="p-6 border-b  dark:border-dark-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-semibold text-primary dark:text-dark-primary">
            {saleType === "cash"
              ? "Cash Sale Details"
              : "Credit Invoice Details"}
          </CardTitle>
          <div className="text-muted-foreground dark:text-dark-muted-foreground font-mono text-sm bg-muted dark:bg-dark-muted px-2 py-1 rounded">
            {invoiceNumber}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="customer" className="font-semibold">
              Customer{" "}
              {saleType === "credit" && (
                <span className="text-destructive dark:text-red-400">*</span>
              )}
            </Label>
            <Select
              onValueChange={setCustomer}
              value={customer}
              disabled={saleType === "cash"}
            >
              <SelectTrigger id="customer">
                <SelectValue
                  placeholder={
                    saleType === "cash"
                      ? "Cash Customer (Optional)"
                      : "Select customer"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {initialCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceDate" className="font-semibold">
              Invoice Date
            </Label>
            <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="font-semibold">
              Due Date
            </Label>
            <DatePicker
              date={dueDate}
              setDate={setDueDate}
              disabled={saleType === "cash"}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesInvoiceHeader;
