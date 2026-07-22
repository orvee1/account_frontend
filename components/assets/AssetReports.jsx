import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const reportActions = [
  "Fixed Asset Register",
  "Depreciation Schedule",
  "Asset Movement Report",
  "Disposal Report",
  "Revaluation Report",
  "Repair & Maintenance History",
];

const AssetReports = ({ assets = [] }) => {
  const downloadCSV = (data, filename) => {
    if (!data.length) return;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(data[0]).join(",") +
      "\n" +
      data.map((entry) => Object.values(entry).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRegister = () => {
    downloadCSV(assets, "fixed-asset-register.csv");
  };

  const handleDownloadDepreciationSchedule = () => {
    const depreciationSchedule = assets.map((asset) => {
      const originalCost = parseFloat(asset.amount) || 0;
      const salvageValue = parseFloat(asset.salvageValue) || 0;
      const usefulLife = parseInt(asset.usefulLife, 10) || 1;
      const monthlyDepreciation = (originalCost - salvageValue) / (usefulLife * 12);

      return {
        "Asset Name": asset.name,
        "Original Cost": originalCost.toFixed(2),
        "Salvage Value": salvageValue.toFixed(2),
        "Useful Life (Years)": usefulLife,
        "Monthly Depreciation": monthlyDepreciation.toFixed(2),
      };
    });

    downloadCSV(depreciationSchedule, "depreciation-schedule.csv");
  };

  const handlers = [
    handleDownloadRegister,
    handleDownloadDepreciationSchedule,
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportActions.map((label, index) => (
          <Button
            key={label}
            variant="outline"
            onClick={handlers[index]}
            className="h-12 justify-start gap-2 border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Download className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AssetReports;
