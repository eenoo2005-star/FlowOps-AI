import { z } from 'zod'

export const requestTypeSchema = z.object({
  workflow_definition_id: z
    .string()
    .min(1, 'Workflow is required.'),

  name: z
    .string()
    .trim()
    .min(1, 'Request type name is required.')
    .max(255, 'Request type name is too long.'),

  code: z
    .string()
    .trim()
    .min(1, 'Request type code is required.')
    .max(80, 'Request type code is too long.')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Use letters, numbers, hyphens or underscores.',
    ),

  description: z
    .string()
    .trim()
    .max(5000, 'Description is too long.'),

  instructions: z
    .string()
    .trim()
    .max(5000, 'Instructions are too long.'),

  is_active: z.boolean(),
})

export type RequestTypeFormValues = z.infer<
  typeof requestTypeSchema
>

export const internalRequestSchema = z.object({
  request_type_id: z
    .string()
    .min(1, 'Request type is required.'),

  requester_employee_id: z.string(),

  title: z
    .string()
    .trim()
    .min(1, 'Request title is required.')
    .max(255, 'Request title is too long.'),

  description: z
    .string()
    .trim()
    .max(10000, 'Description is too long.'),

  priority: z.enum([
    'low',
    'normal',
    'high',
    'urgent',
  ]),
})

export type InternalRequestFormValues = z.infer<
  typeof internalRequestSchema
>