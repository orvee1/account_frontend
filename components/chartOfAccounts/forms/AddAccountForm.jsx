"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, XCircle, PlusCircle } from "lucide-react";

// 🔗 backend api
import { fetchAccountOptions } from "@/services/chartAccounts";

const NO_PARENT_ACCOUNT_VALUE = "__none__";

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}

// Common normalizer for Axios/Laravel style errors
function extractErrors(errOrResult) {
  // priority: explicit result.errors -> axios err.response.data.errors -> generic
  const out = { _server: null };
  if (!errOrResult) return out;

  // If caller returned a plain result object
  if (typeof errOrResult === "object" && errOrResult.ok === false) {
    if (errOrResult.errors && typeof errOrResult.errors === "object") return { ...errOrResult.errors };
    if (errOrResult.message) out._server = errOrResult.message;
    return out;
  }

  // Axios error?
  const e = errOrResult;
  const data = e?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    return { ...data.errors };
  }
  if (data?.message) {
    out._server = data.message;
    return out;
  }
  if (e?.message) {
    out._server = e.message;
  }
  return out;
}

const isRootHeader = (acc) => {
  const pid = acc?.parent_account_id;
  const looksRoot = pid === 0 || pid === "0" || pid == null; // 0 / "0" / null / undefined
  const headerOK = acc?.is_header === undefined ? true : !!acc.is_header; // থাকলে honor করি
  return looksRoot && headerOK;
};

export default function AddAccountForm({
  onSave,                 // (payload, false) => Promise<{ok?:boolean, errors?:object, data?:any}>
  onCancel,
  initialSubAccountData,  // { parent_account_id, account_type, detail_type } (optional)
  existingAccounts = [],
}) {
  const { toast } = useToast();

  const [accountTypesMap, setAccountTypesMap] = useState({});
  const accountTypeOptions = useMemo(() => Object.keys(accountTypesMap || {}), [accountTypesMap]);

  // ---- Form state ----
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountSubtype, setAccountSubtype] = useState("");
  const [parentAccountId, setParentAccountId] = useState(NO_PARENT_ACCOUNT_VALUE);
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingDate, setOpeningDate] = useState(undefined);

  // ---- Parent options (headers) ----
  const [parentOptions, setParentOptions] = useState([]); // [{value,label,isHeader,account_type}]
  const [loadingOptions, setLoadingOptions] = useState(false);

  // errors + loading
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Prefill (add child)
  useEffect(() => {
    if (initialSubAccountData) {
      setParentAccountId(initialSubAccountData.parent_account_id || "");
      setAccountType(initialSubAccountData.account_type || "");
      setAccountSubtype(initialSubAccountData.detail_type || "");
    }
  }, [initialSubAccountData]);

  // 1) Load account types map (no params)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { ok, data } = await fetchAccountOptions(); // <-- types map
        if (!alive) return;

        const types = (data && typeof data === "object" && !Array.isArray(data))
          ? (data.types || data)
          : {};
        setAccountTypesMap(types || {});
      } catch (e) {
        setAccountTypesMap({});
      }
    })();
    return () => { alive = false; };
  }, []);

  const subtypeOptions = useMemo(
    () => (accountType && accountTypesMap?.[accountType]) ? accountTypesMap[accountType] : [],
    [accountType, accountTypesMap]
  );

  const resetForm = () => {
    setAccountName("");
    setAccountNumber("");
    setAccountType("");
    setAccountSubtype("");
    setParentAccountId(NO_PARENT_ACCOUNT_VALUE);
    setOpeningBalance("");
    setOpeningDate(undefined);
    setErrors({});
  };

  const submitToApi = async (closeAfterSave = true) => {
    // client-side minimal check
    if (!accountName || !accountType || !accountSubtype) {
      setErrors((prev) => ({
        ...prev,
        account_name: !accountName ? "Account name is required." : undefined,
        account_type: !accountType ? "Account type is required." : undefined,
        detail_type: !accountSubtype ? "Detail type is required." : undefined,
      }));
      toast({
        title: "Validation Error",
        description: "Account Name, Account Type এবং Detail Type প্রয়োজনীয়।",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      account_name: accountName,
      account_no: accountNumber || undefined,
      account_type: accountType,
      detail_type: accountSubtype,
      parent_account_id: parentAccountId == NO_PARENT_ACCOUNT_VALUE ? null : parentAccountId,
      opening_balance:
        openingBalance === "" || openingBalance == null ? 0 : Number(openingBalance),
      opening_date: openingDate ? openingDate : null,
    };

    setSubmitting(true);
    setErrors({});
    try {
      const res = await onSave?.(payload, false);
      if (res && res.ok) {
        toast({ title: "Account Saved!", description: `${accountName} সফলভাবে যোগ হয়েছে।` });
        if (closeAfterSave) onCancel?.();
        else resetForm();
      } else {
        const errs = extractErrors(res);
        setErrors(errs);
        toast({
          title: "Save failed",
          description: errs._server || "Please review the highlighted fields.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errs = extractErrors(err);
      setErrors(errs);
      toast({
        title: "Save failed",
        description: errs._server || "Network or server error occurred.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setLoadingOptions(true);
    try {
      const base = Array.isArray(existingAccounts) ? existingAccounts : [];
      const list = base
        .filter(isRootHeader)
        .filter(acc => !accountType || acc?.account_type === accountType)
        .map(acc => ({
          value: String(acc.id),
          label: acc.account_name
            ? `${acc.account_name}${acc?.account_type ? ` — ${acc.account_type}` : ""}`
            : `#${acc.id}`,
          account_type: acc?.account_type ?? null,
        }));
      setParentOptions(list);
    } finally {
      setLoadingOptions(false);
    }
  }, [existingAccounts, accountType]);

  const handleSubmit = (e, closeAfterSave = true) => {
    e.preventDefault();
    submitToApi(closeAfterSave);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, true)} className="py-2 text-foreground dark:text-dark-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="col-span-1">
          <Label htmlFor="accountName">Account Name <span className="text-red-500">*</span></Label>
          <Input
            id="accountName"
            value={accountName}
            onChange={(e) => { setAccountName(e.target.value); setErrors((p) => ({ ...p, account_name: null })); }}
            placeholder="e.g., Main Bank Account"
            className="mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input"
            required
          />
          <ErrorText>{errors.account_name?.[0] || errors.account_name}</ErrorText>
        </div>

        <div className="col-span-1">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => { setAccountNumber(e.target.value); setErrors((p) => ({ ...p, account_no: null })); }}
            placeholder="e.g., 1010"
            className="mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input"
          />
          <ErrorText>{errors.account_no?.[0] || errors.account_no}</ErrorText>
        </div>

        <div className="col-span-1">
          <Label htmlFor="accountType">Account Type <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={(value) => { setAccountType(value || accountType); setAccountSubtype(""); setErrors((p) => ({ ...p, account_type: null })); }}
            value={accountType}
            required
          >
            <SelectTrigger id="accountType" className="w-full mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-dark-card text-foreground dark:text-dark-foreground">
              {accountTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText>{errors.account_type?.[0] || errors.account_type}</ErrorText>
        </div>

        <div className="col-span-1">
          <Label htmlFor="accountSubtype">Detail Type <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={(v) => { setAccountSubtype(v || accountSubtype); setErrors((p) => ({ ...p, detail_type: null })); }}
            value={accountSubtype}
            required
          >
            <SelectTrigger id="accountSubtype" className="w-full mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input">
              <SelectValue placeholder="Select account sub-type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-dark-card text-foreground dark:text-dark-foreground">
              {subtypeOptions.map((subtype) => (
                <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText>{errors.detail_type?.[0] || errors.detail_type}</ErrorText>
        </div>

        {(parentAccountId === NO_PARENT_ACCOUNT_VALUE || !parentAccountId) && (
          <>
            <div className="col-span-1">
              <Label htmlFor="opening_balance">Opening Balance</Label>
              <Input
                id="opening_balance"
                type="number"
                value={openingBalance}
                onChange={(e) => { setOpeningBalance(e.target.value); setErrors((p) => ({ ...p, opening_balance: null })); }}
                placeholder="0.00"
                className="mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input"
              />
              <ErrorText>{errors.opening_balance?.[0] || errors.opening_balance}</ErrorText>
            </div>

            <div className="col-span-1">
              <Label htmlFor="opening_date">Opening Balance As of Date</Label>
              <div>
                <DatePicker date={openingDate} setDate={(d) => { setOpeningDate(d); setErrors((p) => ({ ...p, opening_date: null })); }} className="mt-1 w-full" />
              </div>
              <ErrorText>{errors.opening_date?.[0] || errors.opening_date}</ErrorText>
            </div>
          </>
        )}

        <div className="col-span-1">
          <Label htmlFor="parent_account_id">Sub-Account of</Label>
          <Select
            onValueChange={(v) => {
              setParentAccountId(v || parentAccountId); // <- don't fallback to old value
              setErrors((p) => ({ ...p, parent_account_id: null }));
            }}
            value={parentAccountId}            // <- controlled value
            disabled={loadingOptions}
          >
            <SelectTrigger
              id="parent_account_id"
              className="w-full mt-1 bg-white dark:bg-slate-500 border border-input dark:border-dark-input"
            >
              <SelectValue placeholder="Select parent account (optional)" />
            </SelectTrigger>

            <SelectContent className="bg-white dark:bg-dark-card text-foreground dark:text-dark-foreground">
              <SelectItem value={NO_PARENT_ACCOUNT_VALUE}>None</SelectItem>

              {parentOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm opacity-70">
                  No eligible parent accounts
                </div>
              ) : (
                parentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <ErrorText>{errors.parent_account_id?.[0] || errors.parent_account_id}</ErrorText>
        </div>

      </div>

      {errors._server && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errors._server}</p>
      )}

      <DialogFooter className="pt-6 flex flex-wrap gap-2 justify-end">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="bg-rose-600 hover:bg-rose-700 text-white dark:text-white"
            onClick={onCancel}
            disabled={submitting}
          >
            <XCircle size={18} className="mr-2" /> Cancel
          </Button>
        </DialogClose>

        <Button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          variant="secondary"
          className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
          disabled={submitting}
        >
          <PlusCircle size={18} className="mr-2" /> {submitting ? "Saving..." : "Save & New"}
        </Button>

        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:text-white"
          disabled={submitting}
        >
          <Save size={18} className="mr-2" /> {submitting ? "Saving..." : "Save & Close"}
        </Button>
      </DialogFooter>
    </form>
  );
}
