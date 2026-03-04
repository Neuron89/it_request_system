import { z } from 'zod';
import { REQUEST_TYPES, URGENCY_LEVELS, HARDWARE_CATEGORIES, PERMISSION_TYPES, ACCESS_LEVELS } from './constants';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const hardwareSpecsSchema = z.object({
  laptop_size: z.string().optional(),
  laptop_features: z.array(z.string()).optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1).default(1),
  preferred_brand: z.string().optional(),
  current_equipment: z.string().optional(),
});

export const softwareDetailsSchema = z.object({
  software_name: z.string().min(1, 'Software name is required'),
  vendor_url: z.string().url().optional().or(z.literal('')),
  version: z.string().optional(),
  license_type: z.string().optional(),
  estimated_cost: z.string().optional(),
  number_of_licenses: z.number().int().min(1).default(1),
  business_purpose: z.string().min(1, 'Business purpose is required'),
  notes: z.string().optional(),
});

export const permissionDetailsSchema = z.object({
  permission_type: z.enum(PERMISSION_TYPES),
  resource_name: z.string().min(1, 'Resource name is required'),
  resource_path: z.string().optional(),
  access_level: z.enum(ACCESS_LEVELS),
  duration: z.string().optional(),
  current_access: z.string().optional(),
  notes: z.string().optional(),
});

export const accessDetailsSchema = z.object({
  access_type: z.enum(['shared_mailbox', 'distribution_list', 'teams_channel', 'sharepoint_site', 'network_drive', 'other']),
  resource_name: z.string().min(1, 'Resource name is required'),
  resource_email: z.string().optional(),
  access_level: z.enum(ACCESS_LEVELS),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

export const otherDetailsSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

export const createRequestSchema = z.object({
  request_type: z.enum(REQUEST_TYPES),
  urgency: z.enum(URGENCY_LEVELS),
  title: z.string().min(1, 'Title is required').max(200),
  justification: z.string().min(1, 'Justification is required'),
  hardware_specs: hardwareSpecsSchema.optional(),
  software_details: softwareDetailsSchema.optional(),
  permission_details: permissionDetailsSchema.optional(),
  access_details: accessDetailsSchema.optional(),
  other_details: otherDetailsSchema.optional(),
});

export const reviewRequestSchema = z.object({
  decision: z.enum(['approved', 'denied']),
  notes: z.string().optional(),
});
