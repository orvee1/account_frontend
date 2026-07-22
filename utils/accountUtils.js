export const formatAccountForDisplay = (account) => ({
  ...account,
  displaySl: account.sl || null,
  displayBalanceFormatted: (account.balance || 0).toLocaleString("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  detail_type: account.detail_type || "N/A",
});

export const getChildrenAccounts = (accounts, parentaccount_no) => {
  return accounts.filter(
    (acc) => acc.parentaccount_no === parentaccount_no && acc.account_no !== parentaccount_no
  );
};

export const getTotalBalance = (accounts) => {
  return accounts.reduce((total, acc) => total + (acc.balance || 0), 0);
};