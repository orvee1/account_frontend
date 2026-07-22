"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, BarChart3, Calculator, CircleDollarSign } from "lucide-react";

import AssetsRegister from "@/components/assets/AssetsRegister";
import AssetDepreciation from "@/components/assets/AssetDepreciation";   // if you already have
import AssetDisposal from "@/components/assets/AssetDisposal";           // if you already have
import AssetReports from "@/components/assets/AssetReports";             // if you already have

export default function FixedAssetManagementPage() {
  const tabs = [
    { value: "register", label: "Register", icon: Archive },
    { value: "depreciation", label: "Depreciation", icon: Calculator },
    { value: "disposal", label: "Disposal", icon: CircleDollarSign },
    { value: "reports", label: "Reports", icon: BarChart3 },
  ];
  const triggerClass =
    "flex items-center gap-2 rounded-md border-b-0 px-4 py-2.5 text-sm font-semibold";
  const activeClass =
    "border-blue-600 bg-blue-600 text-white shadow-sm hover:text-white";
  const inactiveClass =
    "border-transparent text-gray-600 hover:bg-white hover:text-blue-600";

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={triggerClass}
              activeClassName={activeClass}
              inactiveClassName={inactiveClass}
            >
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="register">
          <AssetsRegister />
        </TabsContent>

        <TabsContent value="depreciation">
          <AssetDepreciation />
        </TabsContent>

        <TabsContent value="disposal">
          <AssetDisposal assets={[]} disposeAsset={() => {}} />
        </TabsContent>

        <TabsContent value="reports">
          <AssetReports assets={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
