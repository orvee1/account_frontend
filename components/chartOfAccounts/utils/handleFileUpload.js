import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function handleFileUpload(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;

      if (extension === "csv") {
        const parsed = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
        });
        resolve(parsed.data);
      } else if (extension === "xlsx") {
        const workbook = XLSX.read(content, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(jsonData);
      } else {
        reject(new Error("Unsupported file type"));
      }
    };

    if (extension === "csv") {
      reader.readAsText(file);
    } else if (extension === "xlsx") {
      reader.readAsBinaryString(file);
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
}
