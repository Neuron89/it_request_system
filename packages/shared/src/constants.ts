export const REQUEST_TYPES = ['hardware', 'software', 'permission', 'access', 'other'] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export const REQUEST_STATUSES = ['draft', 'submitted', 'manager_review', 'it_review', 'approved', 'denied', 'in_progress', 'completed', 'cancelled'] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export const ROLES = ['employee', 'manager', 'it_admin'] as const;
export type Role = typeof ROLES[number];

export const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type UrgencyLevel = typeof URGENCY_LEVELS[number];

export const HARDWARE_CATEGORIES = ['laptop', 'desktop', 'monitor', 'peripheral', 'mobile_device', 'other'] as const;
export type HardwareCategory = typeof HARDWARE_CATEGORIES[number];

export const LAPTOP_SIZES = ['14_inch', '16_inch'] as const;
export const LAPTOP_FEATURES = ['touchscreen', 'tablet_style', 'standard', '2_in_1'] as const;

export const PERMISSION_TYPES = ['folder_access', 'shared_mailbox', 'distribution_list', 'security_group', 'application_access', 'admin_rights', 'other'] as const;
export type PermissionType = typeof PERMISSION_TYPES[number];

export const ACCESS_LEVELS = ['read', 'read_write', 'full_control', 'owner'] as const;
export type AccessLevel = typeof ACCESS_LEVELS[number];

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  manager_review: 'Manager Review',
  it_review: 'IT Review',
  approved: 'Approved',
  denied: 'Denied',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  manager_review: '#f59e0b',
  it_review: '#8b5cf6',
  approved: '#22c55e',
  denied: '#ef4444',
  in_progress: '#06b6d4',
  completed: '#10b981',
  cancelled: '#6b7280',
};
