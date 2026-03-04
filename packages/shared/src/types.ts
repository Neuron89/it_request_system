import type { RequestType, RequestStatus, Role, UrgencyLevel, HardwareCategory, PermissionType, AccessLevel } from './constants';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  department: string;
  manager_id: number | null;
  manager_name?: string;
  manager_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  manager_id: number | null;
}

export interface BaseRequest {
  id: number;
  request_number: string;
  requester_id: number;
  requester_name?: string;
  requester_email?: string;
  requester_department?: string;
  request_type: RequestType;
  status: RequestStatus;
  urgency: UrgencyLevel;
  title: string;
  justification: string;
  manager_id: number | null;
  manager_name?: string;
  manager_email?: string;
  manager_notes?: string;
  manager_decision_at?: string;
  it_admin_notes?: string;
  it_decision_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HardwareRequest extends BaseRequest {
  request_type: 'hardware';
  hardware_category: HardwareCategory;
  hardware_specs: {
    laptop_size?: string;
    laptop_features?: string[];
    description: string;
    quantity: number;
    preferred_brand?: string;
    current_equipment?: string;
  };
}

export interface SoftwareRequest extends BaseRequest {
  request_type: 'software';
  software_details: {
    software_name: string;
    vendor_url?: string;
    version?: string;
    license_type?: string;
    estimated_cost?: string;
    number_of_licenses: number;
    business_purpose: string;
    notes?: string;
  };
}

export interface PermissionRequest extends BaseRequest {
  request_type: 'permission';
  permission_details: {
    permission_type: PermissionType;
    resource_name: string;
    resource_path?: string;
    access_level: AccessLevel;
    duration?: string;
    current_access?: string;
    notes?: string;
  };
}

export interface AccessRequest extends BaseRequest {
  request_type: 'access';
  access_details: {
    access_type: 'shared_mailbox' | 'distribution_list' | 'teams_channel' | 'sharepoint_site' | 'network_drive' | 'other';
    resource_name: string;
    resource_email?: string;
    access_level: AccessLevel;
    duration?: string;
    notes?: string;
  };
}

export interface OtherRequest extends BaseRequest {
  request_type: 'other';
  other_details: {
    category: string;
    description: string;
    notes?: string;
  };
}

export type ITRequest = HardwareRequest | SoftwareRequest | PermissionRequest | AccessRequest | OtherRequest;

export interface RequestComment {
  id: number;
  request_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface RequestHistory {
  id: number;
  request_id: number;
  from_status: RequestStatus | null;
  to_status: RequestStatus;
  changed_by: number;
  changed_by_name: string;
  comment?: string;
  created_at: string;
}
