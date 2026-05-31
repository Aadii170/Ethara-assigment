/**
 * Centralised API service layer.
 * Every backend call goes through this file so the base URL
 * is configured in exactly one place.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

/* ── Products ───────────────────────────────────────────────── */

export const fetchProducts = () => api.get('/products/');
export const fetchProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products/', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

/* ── Customers ──────────────────────────────────────────────── */

export const fetchCustomers = () => api.get('/customers/');
export const fetchCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers/', data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

/* ── Orders ─────────────────────────────────────────────────── */

export const fetchOrders = () => api.get('/orders/');
export const fetchOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders/', data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

/* ── Dashboard ──────────────────────────────────────────────── */

export const fetchDashboard = () => api.get('/dashboard/');

export default api;
