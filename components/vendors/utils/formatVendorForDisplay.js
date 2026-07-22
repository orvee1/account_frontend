// =============================================
// utils/formatVendorForDisplay.js
// =============================================
export default function formatVendorForDisplay(vendor) {
  const displayName = vendor.displayName ?? vendor.display_name ?? "";
  const proprietorName = vendor.proprietorName ?? vendor.proprietor_name ?? "";
  const phoneNumber = vendor.phoneNumber ?? vendor.phone_number ?? "";
  const bankDetails = vendor.bankDetails ?? vendor.bank_details ?? "";
  const creditLimit = vendor.creditLimit ?? vendor.credit_limit ?? 0;
  const openingBalance = vendor.openingBalance ?? vendor.opening_balance ?? 0;
  const openingBalanceDate = vendor.openingBalanceDate ?? vendor.opening_balance_date ?? null;
  const vendorNumber = vendor.vendorNumber ?? vendor.vendor_number ?? null;

  const currentBalance =
    vendor.current_balance ?? vendor.balance ?? openingBalance ?? 0;

  return {
    ...vendor,
    displayName,
    proprietorName,
    phoneNumber,
    bankDetails,
    creditLimit,
    openingBalance,
    openingBalanceDate,
    vendorNumber,
    balance: Number(currentBalance || 0),
    balanceFormatted: Number(currentBalance || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}
