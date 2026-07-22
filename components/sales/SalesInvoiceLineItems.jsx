import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";

const SalesInvoiceLineItems = ({
  lineItems,
  availableProducts,
  handleLineItemChange,
  handleRemoveLineItem,
  handleAddLineItem,
}) => {
  return (
    <div className="overflow-x-auto  dark:bg-dark-background p-4 rounded-lg border  dark:border-dark-border shadow-inner">
      <table className="w-full min-w-[1300px]">
        {" "}
        {/* Adjusted min-width for new column order and spacing */}
        <thead className="border-b-2 border-primary dark:border-dark-primary">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[18%]">
              Product/Service
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[7%]">
              Quantity
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[9%]">
              Qty Unit
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[11%]">
              Rate (Billing Unit)
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[11%]">
              Billing Unit
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[7%]">
              Disc (%)
            </th>
            <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[9%]">
              Disc Amt
            </th>
            <th className="p-3 text-right text-sm font-semibold text-primary dark:text-dark-primary w-[13%]">
              Total Price
            </th>
            <th className="p-3 text-center text-sm font-semibold text-primary dark:text-dark-primary w-[5%]"></th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr
              key={item.id}
              className="border-b  dark:border-dark-border last:border-b-0 hover:bg-muted/50 dark:hover:bg-dark-muted/50 transition-colors"
            >
              <td className="p-2">
                {" "}
                {/* Product/Service */}
                <Select
                  value={item.productId}
                  onValueChange={(value) =>
                    handleLineItemChange(item.id, "productId", value)
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2">
                {" "}
                {/* Quantity Input */}
                <Input
                  type="number"
                  value={item.quantityInput}
                  onChange={(e) =>
                    handleLineItemChange(
                      item.id,
                      "quantityInput",
                      e.target.value
                    )
                  }
                  placeholder="1"
                  className="w-full text-sm"
                  min="0"
                  step="any"
                />
              </td>
              <td className="p-2">
                {" "}
                {/* Quantity Unit */}
                <Select
                  value={item.quantityUnitId}
                  onValueChange={(value) =>
                    handleLineItemChange(item.id, "quantityUnitId", value)
                  }
                  disabled={
                    !item.productDetails ||
                    !item.productDetails.units ||
                    item.productDetails.units.length === 0
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {item.productDetails?.units?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2">
                {" "}
                {/* Rate (Billing Unit) */}
                <Input
                  type="number"
                  value={item.rateForBillingUnit}
                  onChange={(e) =>
                    handleLineItemChange(
                      item.id,
                      "rateForBillingUnit",
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full text-sm"
                  min="0"
                  step="0.01"
                />
              </td>
              <td className="p-2">
                {" "}
                {/* Billing Unit */}
                <Select
                  value={item.billingUnitId}
                  onValueChange={(value) =>
                    handleLineItemChange(item.id, "billingUnitId", value)
                  }
                  disabled={
                    !item.productDetails ||
                    !item.productDetails.units ||
                    item.productDetails.units.length === 0
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {item.productDetails?.units?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.factor} {item.productDetails?.baseUnitName}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2">
                {" "}
                {/* Discount (%) */}
                <Input
                  type="number"
                  value={item.discountPercent}
                  onChange={(e) =>
                    handleLineItemChange(
                      item.id,
                      "discountPercent",
                      e.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full text-sm"
                  min="0"
                  max="100"
                  disabled={!!item.discountAmount && item.discountAmount > 0}
                />
              </td>
              <td className="p-2">
                {" "}
                {/* Discount Amount */}
                <Input
                  type="number"
                  value={item.discountAmount}
                  onChange={(e) =>
                    handleLineItemChange(
                      item.id,
                      "discountAmount",
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full text-sm"
                  min="0"
                  step="0.01"
                  disabled={!!item.discountPercent && item.discountPercent > 0}
                />
              </td>
              <td className="p-2 text-right text-sm font-medium">
                {" "}
                {/* Total Price */}
                {(item.totalPrice || 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </td>
              <td className="p-2 text-center">
                {" "}
                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLineItem(item.id)}
                  className="text-destructive dark:text-red-400 hover:text-destructive/80 dark:hover:text-red-300 h-8 w-8"
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        onClick={handleAddLineItem}
        variant="outline"
        className="mt-4 text-accent dark:text-dark-accent border-accent dark:border-dark-accent hover:bg-accent/10 dark:hover:bg-dark-accent/10 shadow-sm"
      >
        <PlusCircle size={18} className="mr-2" /> Add Line Item
      </Button>
    </div>
  );
};

export default SalesInvoiceLineItems;
