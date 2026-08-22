export const chartData = [
  {
    title: "ASSETS",
    color: "text-green-600",
    children: [
      {
        name: "Fixed Assets",
        details: "Long-term assets like land, buildings, and machinery.",
        children: [
          { name: "Land", details: "Plots and real estate owned by the company." },
          { name: "Buildings", details: "All company-owned structures and offices." },
          { name: "Machinery", details: "Industrial machines and production equipment." },
        ],
      },
      {
        name: "Current Assets",
        details: "Short-term, liquid assets.",
        children: [
          {
            name: "Cash & Cash Equivalent",
            details: "Cash and bank balances.",
            children: [
              { name: "Cash in Hand", details: "Cash held at the company site." },
              { name: "Cash at Bank", details: "Funds available in bank accounts." },
            ],
          },
          { name: "Accounts Receivable", details: "Money owed by customers." },
        ],
      },
      {
        name: "Other Assets",
        details: "Miscellaneous assets not classified elsewhere.",
        children: [
          { name: "Investments", details: "Stocks, bonds, and other investments." },
          { name: "Intangible Assets", details: "Patents, trademarks, and goodwill." },
        ],
      },
    ],
  },
  {
    title: "LIABILITIES",
    color: "text-red-600",
    children: [
      {
        name: "Capital Account",
        details: "Owner’s investment in the business.",
        children: [
          { name: "Equity", details: "Shareholders’ equity and retained earnings." },
          { name: "Owner’s Equity", details: "Funds contributed by owners." },
        ],
      },
    ],
  },
  {
    title: "INCOME",
    color: "text-blue-600",
    children: [
      {
        name: "Sales",
        details: "Revenue generated from selling goods or services.",
        children: [
          { name: "Sales Revenue", details: "Main income from operations." },
          { name: "Sales Returns", details: "Returned goods adjustments." },
        ],
      },
    ],
  },
  {
    title: "EXPENSES",
    color: "text-orange-600",
    children: [
      {
        name: "Office Expenses",
        details: "Operating expenses for running the office.",
        children: [
          { name: "Rent", details: "Office space rental costs." },
          { name: "Utilities", details: "Electricity, water, internet, etc." },
          { name: "Advertising", details: "Marketing and promotion costs." },
        ],
      },
    ],
  },
];
