import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SalesInvoiceTotals = ({
  notes,
  setNotes,
  terms,
  setTerms,
  subtotal,
  totalDiscountDisplay,
  taxAmount,
  setTaxAmount,
  grandTotal,
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start pt-8">
      <div className="space-y-4">
        <div>
          <Label htmlFor="notes" className="font-semibold">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any notes for the customer..."
            className="mt-1 min-h-[100px]"
          />
        </div>
        <div>
          <Label htmlFor="terms" className="font-semibold">
            Terms & Conditions
          </Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Enter payment terms or other conditions..."
            className="mt-1 min-h-[100px]"
          />
        </div>
      </div>
      <div className="space-y-3 p-4 bg-muted/70 dark:bg-dark-muted/70 rounded-lg shadow-inner border  dark:border-dark-border">
        <div className="flex justify-between items-center">
          <span className="font-medium">Subtotal:</span>
          <span className="font-semibold">
            {subtotal.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Discount:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {totalDiscountDisplay}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Label htmlFor="taxAmount" className="font-medium">
            Tax (% or Amount):
          </Label>
          <Input
            id="taxAmount"
            type="number"
            value={taxAmount}
            onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-28 text-sm text-right"
            min="0"
            step="0.01"
          />
        </div>
        <hr className=" dark:border-dark-border my-2" />
        <div className="flex justify-between items-center text-xl text-primary dark:text-dark-primary font-bold">
          <span>Grand Total:</span>
          <span>
            {grandTotal.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceTotals;
