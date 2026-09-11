import axios from 'axios';

const API_BASE = "/api/backend";

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
};

// Sales Orders
export const createSalesOrder = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-orders`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error creating sales order:', error.message);
    throw error;
  }
};

export const getSalesOrders = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-orders`, { params, headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales orders:', error.message);
    return { data: [] };
  }
};

export const getSalesOrder = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-orders/${id}`, { headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales order:', error.message);
    return { data: {} };
  }
};

export const updateSalesOrder = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE}/sales-orders/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error updating sales order:', error.message);
    throw error;
  }
};

export const deleteSalesOrder = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE}/sales-orders/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error deleting sales order:', error.message);
    throw error;
  }
};

export const convertSalesOrderToInvoice = async (id) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-orders/${id}/convert-to-invoice`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error converting sales order:', error.message);
    throw error;
  }
};

// Sales Invoices
export const createSalesInvoice = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-invoices`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error creating sales invoice:', error.message);
    throw error;
  }
};

export const getSalesInvoices = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-invoices`, { params, headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales invoices:', error.message);
    return { data: [], meta: { last_page: 1 } };
  }
};

export const getSalesInvoice = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-invoices/${id}`, { headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales invoice:', error.message);
    return { data: {} };
  }
};

export const updateSalesInvoice = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE}/sales-invoices/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error updating sales invoice:', error.message);
    throw error;
  }
};

export const deleteSalesInvoice = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE}/sales-invoices/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error deleting sales invoice:', error.message);
    throw error;
  }
};

export const createSalesReturn = async (id, data) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-invoices/${id}/create-return`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error creating sales return:', error.message);
    throw error;
  }
};

export const recordSalesPayment = async (id, data) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-invoices/${id}/record-payment`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error recording sales payment:', error.message);
    throw error;
  }
};

// Sales Returns
export const createSalesReturnDirect = async (data, idempotencyKey) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-returns`, data, { headers: { ...getAuthHeaders(), ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) } });
    return response.data;
  } catch (error) {
    console.error('Error creating sales return:', error.message);
    throw error;
  }
};

export const getSalesReturns = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-returns`, { params, headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales returns:', error.message);
    return { data: [] };
  }
};

export const getSalesReturn = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-returns/${id}`, { headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales return:', error.message);
    return { data: {} };
  }
};

export const deleteSalesReturn = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE}/sales-returns/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error deleting sales return:', error.message);
    throw error;
  }
};

// Sales Payments
export const createSalesPayment = async (data) => {
  try {
    const response = await axios.post(`${API_BASE}/sales-payments`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error creating sales payment:', error.message);
    throw error;
  }
};

export const getSalesPayments = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-payments`, { params, headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales payments:', error.message);
    return { data: [] };
  }
};

export const getSalesPayment = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/sales-payments/${id}`, { headers: getAuthHeaders(), timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales payment:', error.message);
    return { data: {} };
  }
};

export const deleteSalesPayment = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE}/sales-payments/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error deleting sales payment:', error.message);
    throw error;
  }
};
