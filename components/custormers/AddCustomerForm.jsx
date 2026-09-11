'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { fetchCustomerCode } from '@/services/customer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AddCustomerForm = ({ onSave, onCancel, initialData, isEditMode }) => {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [proprietorName, setProprietorName] = useState('');
  const [customerNumber, setCustomerNumber] = useState(''); // manual customer code entry
  const [autoCustomerCode, setAutoCustomerCode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nid, setNid] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingBalanceType, setOpeningBalanceType] = useState('');
  const [openingBalanceDate, setOpeningBalanceDate] = useState(undefined);
  const [originalId, setOriginalId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (isEditMode && initialData) {
      setCustomerName(initialData.name || '');
      setDisplayName(initialData.displayName || '');
      setProprietorName(initialData.proprietorName || '');
      setCustomerNumber(initialData.customerNumber || initialData.customer_number || '');
      setAutoCustomerCode(false);
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setNid(initialData.nid || '');
      setBankDetails(initialData.bankDetails || '');
      setNotes(initialData.notes || '');
      setCreditLimit(initialData.creditLimit?.toString() || '');
      setOpeningBalance(initialData.openingBalance?.toString() || '');
      setOpeningBalanceType(initialData.openingBalanceType || '');
      setOpeningBalanceDate(initialData.openingBalanceDate ? toDateInput(initialData.openingBalanceDate) : '');
      setOriginalId(initialData.id || null);
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [initialData, isEditMode]);

  const resetForm = () => {
    setCustomerName('');
    setDisplayName('');
    setProprietorName('');
    setCustomerNumber('');
    setAutoCustomerCode(false);
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setNid('');
    setBankDetails('');
    setNotes('');
    setCreditLimit('');
    setOpeningBalance('');
    setOpeningBalanceType('');
    setOpeningBalanceDate(undefined);
    setOriginalId(null);
  };

  const handleSubmit = async (e, closeAfterSave = true) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');
    if (!customerName) {
      toast({
        title: "Validation Error",
        description: "Customer Name is required.",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      id: isEditMode ? originalId : undefined,
      name: customerName,
      displayName,
      proprietorName,
      customerNumber: !isEditMode ? customerNumber || null : undefined,
      phoneNumber,
      email,
      address,
      nid,
      bankDetails,
      notes,
      creditLimit: parseFloat(creditLimit) || 0,
      openingBalance: parseFloat(openingBalance) || 0,
      openingBalanceType: openingBalanceType || null,
      openingBalanceDate: openingBalanceDate || null,
    };

    setSaving(true);
    try {
      await onSave(customerData, isEditMode);

      toast({
        title: `Customer ${isEditMode ? 'Updated' : 'Saved'}!`,
        description: `${customerName} has been successfully ${isEditMode ? 'updated' : 'added'}.`,
      });

      if (closeAfterSave) {
        onCancel();
      } else if (!isEditMode) {
        resetForm();
      }
    } catch (error) { setSaveError(error.message || 'Could not save customer.'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4 py-2">
      {saveError && <p role="alert" className="text-red-600">{saveError}</p>}
      <DialogHeader className="hidden">
        <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? 'Update customer details.' : 'Fill in the details to add a new customer.'}
        </DialogDescription>
      </DialogHeader>

      <div>
        <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="e.g., Client Omega Corp."
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., Omega Corp."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="proprietorName">Proprietor Name</Label>
        <Input
          id="proprietorName"
          value={proprietorName}
          onChange={(e) => setProprietorName(e.target.value)}
          placeholder="e.g., Jane Smith"
          className="mt-1"
        />
      </div>

      {/* UI only (server-managed) */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="customerNumber">Customer Code</Label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              id="autoCustomerCode"
              type="checkbox"
              checked={autoCustomerCode}
              onChange={async (e) => {
                const checked = e.target.checked;
                setAutoCustomerCode(checked);
                if (!checked) {
                  setCustomerNumber('');
                  return;
                }

                const res = await fetchCustomerCode();
                if (res.ok && res.data?.code) {
                  setCustomerNumber(res.data.code);
                } else {
                  setCustomerNumber('');
                }
              }}
              disabled={isEditMode}
              className="h-4 w-4 rounded border border-input text-primary focus:ring-primary"
            />
            Auto
          </label>
        </div>
        <Input
          id="customerNumber"
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
          placeholder={autoCustomerCode ? "Generated by server" : "e.g., C001"}
          className="mt-1"
          disabled={isEditMode || autoCustomerCode}
        />
        <p className="text-xs text-muted-foreground">
          {isEditMode
            ? 'Customer code cannot be changed after creation.'
            : autoCustomerCode
              ? 'Customer code will be generated automatically by the server.'
              : 'Enter a customer code manually.'}
        </p>
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g., +1234567890"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., contact@example.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 456 Client Ave"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="nid">NID</Label>
        <Input
          id="nid"
          value={nid}
          onChange={(e) => setNid(e.target.value)}
          placeholder="e.g., 1234567890"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="creditLimit">Credit Limit</Label>
        <Input
          id="creditLimit"
          type="number"
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          placeholder="e.g., 5000.00"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="bankDetails">Bank Details</Label>
        <Textarea
          id="bankDetails"
          value={bankDetails}
          onChange={(e) => setBankDetails(e.target.value)}
          placeholder="e.g., Bank Name, Account Number, etc."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Any special instructions or notes about the customer."
          className="mt-1"
        />
      </div>

      {!isEditing && (
        <>

          <div>
            <Label htmlFor="openingBalanceType">Opening Balance Type <span className="text-red-500">*</span></Label>
            <Select
              onValueChange={(v) => setOpeningBalanceType(v)}
              value={openingBalanceType}
            >
              <SelectTrigger id="openingBalanceType" className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="openingBalance">Opening Balance</Label>
            <Input
              id="openingBalance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="openingBalanceDate">Opening Balance As of Date</Label>
            <input
              id="openingBalanceDate"
              type="date"
              value={openingBalanceDate || ''}
              onChange={(e) => setOpeningBalanceDate(e.target.value)}
              className="mt-1 w-full px-2 py-2 border border-input dark:border-dark-input rounded bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </>
      )}

      <DialogFooter className="pt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        </DialogClose>
        {!isEditMode && (
          <Button type="button" disabled={saving} onClick={(e) => handleSubmit(e, false)} variant="secondary">
            <Save size={18} className="mr-2" /> Save & New
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          <Save size={18} className="mr-2" /> {isEditMode ? 'Update Customer' : 'Save & Close'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AddCustomerForm;
