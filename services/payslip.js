// services/payslip.js
import { server, responseData } from "@/services/server";

// Get all payslips
export async function fetchPayslips(params = {}) {
  const res = await server.get("/payslips", { params });
  return responseData(res);
}

// Get single payslip
export async function getPayslip(id) {
  const res = await server.get(`/payslips/${id}`);
  return responseData(res);
}

// Get payslips for an employee
export async function getEmployeePayslips(employeeId, params = {}) {
  const res = await server.get(`/payslips/employee/${employeeId}`, { params });
  return responseData(res);
}

// Download payslip as PDF
export async function downloadPayslipPDF(id) {
  const res = await server.get(`/payslips/${id}/pdf`, {
    responseType: 'blob'
  });
  return res;
}

// Email payslip to employee
export async function emailPayslip(id) {
  const res = await server.post(`/payslips/${id}/email`);
  return responseData(res);
}

// Get payslips by month/year
export async function getPayslipsByPeriod(month, year, params = {}) {
  const res = await server.get("/payslips", {
    params: { ...params, month, year }
  });
  return responseData(res);
}
