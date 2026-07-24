"use client";

import React, { useEffect, useState } from "react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchAssetDepreciations,
  createAssetDepreciation,
  updateAssetDepreciation,
  deleteAssetDepreciation,
} from "@/services/assetDepreciation";
import { fetchAssets } from "@/services/asset"; // ✅ new import

// ✅ local chart of accounts
const getChartOfAccountsFromStorage = () => {
  const stored = localStorage.getItem("chartOfAccounts");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [
    { id: "acc-1", name: "Depreciation Expense" },
    { id: "acc-2", name: "Accumulated Depreciation" },
  ];
};

const AddDepreciationEntryForm = ({ addEntry, assets, chartOfAccounts }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    assetId: "",
    assetName: "",
    tagNo: "",
    method: "Straight Line",
    frequency: "Monthly",
    timeOfEntry: "Last day of the period",
    amount: "",
    debitAcc: "Depreciation Expense",
    creditAcc: "Accumulated Depreciation",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAssetSelect = (value) => {
    const selected = assets.find((a) => String(a.id) === String(value));
    if (!selected) return;
    const A = parseFloat(selected.amount) || 0;
    const S = parseFloat(selected.salvageValue || selected.salvage_value) || 0;
    const L = parseInt(selected.usefulLife || selected.useful_life) || 1;
    const m = (A - S) / (L * 12);
    setFormData((p) => ({
      ...p,
      assetId: value,
      assetName: selected.name,
      tagNo: selected.tagSerialNumber || selected.tag_serial_number,
      amount: m.toFixed(2),
    }));
  };

  const handleSubmit = async (e) => {
    
    e.preventDefault();
    if (!assets.length) {
      toast({
        title: "No Assets Found",
        description: "Please add at least one asset before creating depreciation entry.",
        variant: "destructive",
      });
      return;
    }
    await addEntry(formData);
    setFormData({
      assetId: "",
      assetName: "",
      tagNo: "",
      method: "Straight Line",
      frequency: "Monthly",
      timeOfEntry: "Last day of the period",
      amount: "",
      debitAcc: "Depreciation Expense",
      creditAcc: "Accumulated Depreciation",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 py-4">
      <div>
        <Label htmlFor="assetId">Select Asset</Label>
        <Select onValueChange={handleAssetSelect} value={formData.assetId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id.toString()}>
                {asset.name} ({asset.tagSerialNumber || asset.tag_serial_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div><Label htmlFor="method">Method</Label><Input id="method" value={formData.method} onChange={handleChange} /></div>

      <div>
        <Label htmlFor="frequency">Frequency</Label>
        <Select onValueChange={(v) => handleSelectChange("frequency", v)} value={formData.frequency}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div><Label htmlFor="timeOfEntry">Time of Entry</Label><Input id="timeOfEntry" value={formData.timeOfEntry} disabled /></div>

      <div><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" value={formData.amount} onChange={handleChange} /></div>

      <div><Label htmlFor="debitAcc">Debit Account</Label><Input id="debitAcc" value={formData.debitAcc} onChange={handleChange} /></div>

      <div>
        <Label htmlFor="creditAcc">Credit Account</Label>
        <Select onValueChange={(v) => handleSelectChange("creditAcc", v)} value={formData.creditAcc}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {chartOfAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.name ?? acc.account_name}>{acc.name ?? acc.account_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} /></div>
      <div><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} /></div>

      <Button type="submit" className="mt-4">Add Entry</Button>
    </form>
  );
};

export default function AssetDepreciation({ companyId }) {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddEntryFormOpen, setIsAddEntryFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const chartOfAccounts = getChartOfAccountsFromStorage();
  const filteredEntries = entries.filter((entry) => {
    const term = appliedSearchTerm.trim().toLowerCase();
    if (!term) return true;

    return [
      entry.asset?.name,
      entry.asset?.tag_serial_number,
      entry.method,
      entry.frequency,
      entry.amount,
      entry.debit_acc_name,
      entry.credit_acc_name,
      entry.start_date,
      entry.end_date,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
  

  // ✅ Load both assets and depreciations
  const loadData = async () => {
    setLoading(true);
    console.log({companyId});
    
    try {
      const [assetsRes, depRes] = await Promise.all([
        fetchAssets({ per_page: 100, company_id: companyId }),
        fetchAssetDepreciations({ per_page: 100, company_id: companyId }),
      ]);

      const aList = Array.isArray(assetsRes?.data?.data)
        ? assetsRes.data.data
        : Array.isArray(assetsRes?.data)
        ? assetsRes.data
        : [];

      const dList = Array.isArray(depRes?.data?.data)
        ? depRes.data.data
        : Array.isArray(depRes?.data)
        ? depRes.data
        : [];

      setAssets(aList);
      setEntries(dList);
    } catch (e) {
      toast({ title: "Load failed", description: "Could not fetch assets or depreciations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Add entry via API
  const addEntry = async (formData) => {
    try {
      const payload = {
        fixedAssetId: formData.assetId,
        method: formData.method,
        frequency: formData.frequency,
        timeOfEntry: formData.timeOfEntry,
        amount: formData.amount,
        debitAcc: formData.debitAcc,
        creditAcc: formData.creditAcc,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: true,
        companyId,
      };
      const res = await createAssetDepreciation(payload);
      if (res?.ok === false) {
        toast({ title: "Validation failed", description: res?.data?.message, variant: "destructive" });
        return;
      }
      toast({ title: "Entry Added", description: "Depreciation entry created." });
      setIsAddEntryFormOpen(false);
      await loadData();
    } catch {
      toast({ title: "Error", description: "Failed to create entry", variant: "destructive" });
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    await deleteAssetDepreciation(id);
    toast({ title: "Deleted", description: "Entry removed successfully" });
    await loadData();
  };

  return (
    <div className="p-4 border rounded-lg">
      <Tabs defaultValue="automatic-entry" className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="automatic-entry">Automatic Entry</TabsTrigger>
          <TabsTrigger value="depreciation-schedule">Depreciation Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="automatic-entry">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                <Input
                  placeholder="Search depreciation entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setAppliedSearchTerm(searchTerm)}
                  className="mr-auto w-full sm:w-64 md:w-80"
                />
                <Button onClick={() => setAppliedSearchTerm(searchTerm)}>Search</Button>
                <Dialog open={isAddEntryFormOpen} onOpenChange={setIsAddEntryFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10">
                    <Plus className="mr-2 h-4 w-4" /> Add Automatic Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Automatic Depreciation Entry</DialogTitle>
                    </DialogHeader>
                    <AddDepreciationEntryForm
                      addEntry={addEntry}
                      assets={assets}
                      chartOfAccounts={chartOfAccounts}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Debit Acc</TableHead>
                    <TableHead>Credit Acc</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, i) => (
                    <TableRow key={entry.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{entry.asset?.name} ({entry.asset?.tag_serial_number})</TableCell>
                      <TableCell>{entry.method}</TableCell>
                      <TableCell>{entry.frequency}</TableCell>
                      <TableCell>{entry.amount}</TableCell>
                      <TableCell>{entry.debit_acc_name}</TableCell>
                      <TableCell>{entry.credit_acc_name}</TableCell>
                      <TableCell>{entry.start_date}</TableCell>
                      <TableCell>{entry.end_date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                        {appliedSearchTerm
                          ? `No depreciation entries found for "${appliedSearchTerm}".`
                          : "No depreciation entries found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="depreciation-schedule">
          <p className="mt-4 text-lg">Depreciation Schedule details will be displayed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
