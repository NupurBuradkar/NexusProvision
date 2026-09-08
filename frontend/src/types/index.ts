export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Developer {
  id: number;
  full_name: string;
  email: string;
  github_username?: string;
  team: string;
  role_title: string;
  seniority: string;
  status: 'pre_boarding' | 'in_progress' | 'completed' | 'offboarded';
  start_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  checklist_tasks: DeveloperChecklistStatus[];
  access_grants: AccessGrant[];
  repo_requests: RepoRequest[];
}

export interface DeveloperProgressSummary {
  developer_id: number;
  developer_name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  task_completion_percentage: number;
  total_systems: number;
  active_systems: number;
  access_completion_percentage: number;
  overall_progress_percentage: number;
}

export interface ChecklistTemplateItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  team?: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface DeveloperChecklistStatus {
  id: number;
  developer_id: number;
  template_item_id?: number;
  title: string;
  description?: string;
  category: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessSystem {
  id: number;
  name: string;
  category: string;
  description?: string;
  icon_key: string;
  is_active: boolean;
  created_at: string;
}

export interface AccessGrant {
  id: number;
  developer_id: number;
  system_id: number;
  granted_by_user_id?: number;
  status: 'pending' | 'active' | 'revoked';
  access_level: 'admin' | 'write' | 'read' | 'viewer';
  granted_at?: string;
  revoked_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  system?: AccessSystem;
}

export interface RepoRequest {
  id: number;
  name: string;
  description?: string;
  visibility: 'private' | 'internal' | 'public';
  status: 'pending' | 'provisioning' | 'ready' | 'failed';
  github_url?: string;
  branch_protection_enabled: boolean;
  template_repo?: string;
  developer_id: number;
  requested_by_user_id?: number;
  provisioned_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  actor_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  timestamp: string;
}

export interface DashboardStats {
  kpis: {
    total_developers: number;
    active_onboardings: number;
    completed_onboardings: number;
    checklist_completion_rate: number;
    pending_access_requests: number;
    active_access_grants: number;
    total_repos_provisioned: number;
    pending_repos: number;
  };
  team_breakdown: Record<string, number>;
  recent_audit_logs: AuditLog[];
  notifications: Array<{
    event_type: string;
    title: string;
    message: string;
    severity: string;
    metadata: Record<string, any>;
    timestamp: string;
  }>;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
