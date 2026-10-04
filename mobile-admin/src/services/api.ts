import { storage } from './storage';
import { CONFIG } from '../constants/config';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

class ApiService {
  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl = await storage.getApiUrl();
    const token = await storage.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized (session expired)
      if (response.status === 401) {
        if (!endpoint.includes('/login')) {
          await storage.removeToken();
          await storage.removeUser();
        }
      }

      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Réponse serveur non valide (${response.status})`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Erreur requête (${response.status})`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Délai d\'attente réseau dépassé. Vérifiez votre connexion internet.');
      }
      throw err;
    }
  }

  // --- AUTHENTICATION ---
  async login(identifier: string, password: string, rememberMe = true) {
    const data = await this.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, rememberMe }),
    });

    if (data.token) {
      await storage.setToken(data.token);
    }
    if (data.user) {
      await storage.setUser(data.user);
    }

    return data;
  }

  async getMe() {
    return this.request('/api/admin/auth/me', { method: 'GET' });
  }

  async logout() {
    try {
      await this.request('/api/admin/logout', { method: 'POST' }).catch(() => {});
    } finally {
      await storage.removeToken();
      await storage.removeUser();
    }
  }

  // --- DASHBOARD KPIS ---
  async getDashboard(period = 'today') {
    return this.request(`/api/admin/mobile/dashboard?period=${period}`, { method: 'GET' });
  }

  // --- ORDERS ---
  async getOrders() {
    return this.request('/api/admin/orders', { method: 'GET' });
  }

  async updateOrder(id: string, payload: {
    status?: string;
    carrier?: string;
    trackingNumber?: string;
    customNote?: string;
    actorNameOverride?: string;
  }) {
    return this.request('/api/admin/orders', {
      method: 'PUT',
      body: JSON.stringify({ id, ...payload }),
    });
  }

  // --- PRODUCTS & STOCK ---
  async getProducts() {
    return this.request('/api/admin/inventory', { method: 'GET' });
  }

  async updateStock(id: number, stock: number) {
    return this.request('/api/admin/inventory', {
      method: 'PUT',
      body: JSON.stringify({ id, stock }),
    });
  }

  // --- CASH COLLECTION & ENCAISSEMENTS ---
  async getCashSummary() {
    return this.request('/api/admin/mobile/cash', { method: 'GET' });
  }

  // --- CUSTOMERS ---
  async getCustomers(search = '', filter = 'all') {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filter) params.set('filter', filter);
    return this.request(`/api/admin/mobile/customers?${params.toString()}`, { method: 'GET' });
  }

  // --- TEAM & EMPLOYEES ---
  async getTeam() {
    return this.request('/api/admin/team', { method: 'GET' });
  }

  // --- AUDIT LOGS ---
  async getActivityLogs(period = 'ALL', limit = 40) {
    return this.request(`/api/admin/activity?period=${period}&limit=${limit}`, { method: 'GET' });
  }

  // --- PUSH TEST ---
  async sendTestPush(category = 'ORDER') {
    return this.request('/api/admin/push/test', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  }
}

export const api = new ApiService();
