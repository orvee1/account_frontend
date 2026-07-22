"use client";

import PurchaseBillForm from "@/components/purchases/PurchaseBillForm";
import { useParams } from "next/navigation";

export default function EditPurchaseBillPage() {
  const { id } = useParams();
  
  return <PurchaseBillForm billId={id} />;
}
