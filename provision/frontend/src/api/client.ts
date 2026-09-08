import {
  AuthResponse,
  User,
  Developer,
  DeveloperProgressSummary,
  ChecklistTemplateItem,
  DeveloperChecklistStatus,
  AccessSystem,
  AccessGrant,
  RepoRequest,
  DashboardStats,
  AuditLog,
  Page,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('seqa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 204) {
        return {} as T;
      }

      if (!response.ok) {
        let errorDetail = `HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail || errJson.message || errorDetail;
        } catch {
          // ignore
        }

        if (response.status === 401) {
          localStorage.removeItem('seqa_token');
          localStorage.removeItem('seqa_user');
          window.dispatchEvent(new Event('seqa-auth-expired'));
        }

        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  public auth = {
    login: async (email: string, password: string): Promise<AuthResponse & { developer_id?: number }> => {
      const res = await this.request<AuthResponse & { developer_id?: number }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('seqa_token', res.access_token);
      localStorage.setItem('seqa_user', JSON.stringify(res.user));
      if (res.developer_id) {
        localStorage.setItem('seqa_dev_id', res.developer_id.toString());
      } else {
        localStorage.removeItem('seqa_dev_id');
      }
      return res;
    },
    employeeLogin: async (data: { email: string; full_name?: string; designation: string; team?: string }): Promise<AuthResponse & { developer_id?: number }> => {
      const res = await this.request<AuthResponse & { developer_id?: number }>('/auth/employee-login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      localStorage.setItem('seqa_token', res.access_token);
      localStorage.setItem('seqa_user', JSON.stringify(res.user));
      if (res.developer_id) {
        localStorage.setItem('seqa_dev_id', res.developer_id.toString());
      }
      return res;
    },
    getMe: async (): Promise<User> => {
      return this.request<User>('/auth/me');
    },
    logout: () => {
      localStorage.removeItem('seqa_token');
      localStorage.removeItem('seqa_user');
      localStorage.removeItem('seqa_dev_id');
      window.dispatchEvent(new Event('seqa-auth-logout'));
    },
  };

  // Developers
  public developers = {
    list: async (params?: { page?: number; pageSize?: number; search?: string; team?: string; status?: string }): Promise<Page<Developer>> => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.pageSize) query.append('page_size', params.pageSize.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.team) query.append('team', params.team);
      if (params?.status) query.append('status', params.status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request<Page<Developer>>(`/developers${qs}`);
    },
    get: async (id: number): Promise<Developer> => {
      return this.request<Developer>(`/developers/${id}`);
    },
    create: async (data: Partial<Developer> & { auto_generate_checklist?: boolean; auto_grant_default_access?: boolean }): Promise<Developer> => {
      return this.request<Developer>('/developers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: Partial<Developer>): Promise<Developer> => {
      return this.request<Developer>(`/developers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: number): Promise<void> => {
      return this.request<void>(`/developers/${id}`, { method: 'DELETE' });
    },
    getProgress: async (id: number): Promise<DeveloperProgressSummary> => {
      return this.request<DeveloperProgressSummary>(`/developers/${id}/progress`);
    },
  };

  // Checklist
  public checklist = {
    getTemplates: async (team?: string): Promise<ChecklistTemplateItem[]> => {
      const qs = team ? `?team=${encodeURIComponent(team)}` : '';
      return this.request<ChecklistTemplateItem[]>(`/checklist/templates${qs}`);
    },
    createTemplate: async (data: Partial<ChecklistTemplateItem>): Promise<ChecklistTemplateItem> => {
      return this.request<ChecklistTemplateItem>('/checklist/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deleteTemplate: async (id: number): Promise<void> => {
      return this.request<void>(`/checklist/templates/${id}`, { method: 'DELETE' });
    },
    toggleTask: async (taskId: number, isCompleted: boolean, notes?: string): Promise<DeveloperChecklistStatus> => {
      return this.request<DeveloperChecklistStatus>(`/checklist/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: isCompleted, notes }),
      });
    },
  };

  // Access Systems & Grants
  public access = {
    getSystems: async (): Promise<AccessSystem[]> => {
      return this.request<AccessSystem[]>('/access/systems');
    },
    createSystem: async (data: Partial<AccessSystem>): Promise<AccessSystem> => {
      return this.request<AccessSystem>('/access/systems', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getGrants: async (developerId?: number, status?: string): Promise<AccessGrant[]> => {
      const query = new URLSearchParams();
      if (developerId) query.append('developer_id', developerId.toString());
      if (status) query.append('status', status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request<AccessGrant[]>(`/access/grants${qs}`);
    },
    createGrant: async (data: { developer_id: number; system_id: number; access_level?: string; status?: string; notes?: string }): Promise<AccessGrant> => {
      return this.request<AccessGrant>('/access/grants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateGrant: async (grantId: number, data: { status?: string; access_level?: string; notes?: string }): Promise<AccessGrant> => {
      return this.request<AccessGrant>(`/access/grants/${grantId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  };

  // Repositories
  public repos = {
    list: async (developerId?: number): Promise<RepoRequest[]> => {
      const qs = developerId ? `?developer_id=${developerId}` : '';
      return this.request<RepoRequest[]>(`/repos${qs}`);
    },
    request: async (data: { developer_id: number; name: string; description?: string; visibility?: string; branch_protection_enabled?: boolean }): Promise<RepoRequest> => {
      return this.request<RepoRequest>('/repos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    provision: async (repoId: number, addDeveloper: boolean = true, permission: string = 'admin'): Promise<RepoRequest> => {
      return this.request<RepoRequest>(`/repos/${repoId}/provision`, {
        method: 'POST',
        body: JSON.stringify({ add_developer_as_collaborator: addDeveloper, permission }),
      });
    },
  };

  // Dashboard & Audit
  public dashboard = {
    getStats: async (): Promise<DashboardStats> => {
      return this.request<DashboardStats>('/dashboard/stats');
    },
    getAuditLogs: async (limit: number = 50): Promise<AuditLog[]> => {
      return this.request<AuditLog[]>(`/dashboard/audit?limit=${limit}`);
    },
  };
}

export const api = new ApiClient();
