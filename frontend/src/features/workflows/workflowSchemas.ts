import { z } from 'zod'

export const workflowDefinitionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Workflow name is required.')
    .max(255, 'Workflow name is too long.'),

  code: z
    .string()
    .trim()
    .min(1, 'Workflow code is required.')
    .max(80, 'Workflow code is too long.')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Use letters, numbers, hyphens or underscores.',
    ),

  description: z
    .string()
    .trim()
    .max(5000, 'Description is too long.'),

  version: z
    .string()
    .trim()
    .refine(
      (value) =>
        Number.isInteger(Number(value)) &&
        Number(value) >= 1 &&
        Number(value) <= 9999,
      'Version must be an integer from 1 to 9999.',
    ),

  is_active: z.boolean(),
})

export type WorkflowDefinitionFormValues = z.infer<
  typeof workflowDefinitionSchema
>

export const workflowStepSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Step name is required.')
      .max(255, 'Step name is too long.'),

    code: z
      .string()
      .trim()
      .min(1, 'Step code is required.')
      .max(80, 'Step code is too long.')
      .regex(
        /^[A-Za-z0-9_-]+$/,
        'Use letters, numbers, hyphens or underscores.',
      ),

    description: z
      .string()
      .trim()
      .max(5000, 'Description is too long.'),

    step_order: z
      .string()
      .trim()
      .refine(
        (value) =>
          Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= 1000,
        'Order must be an integer from 1 to 1000.',
      ),

    approver_type: z.enum([
      'role',
      'employee',
      'requester_manager',
      'department_manager',
    ]),

    approver_role: z
      .string()
      .trim()
      .max(100, 'Role name is too long.'),

    approver_employee_id: z.string(),

    approval_mode: z.enum([
      'any',
      'all',
    ]),

    required_approvals: z
      .string()
      .trim()
      .refine(
        (value) =>
          Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= 100,
        'Required approvals must be from 1 to 100.',
      ),

    sla_hours: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          (
            Number.isInteger(Number(value)) &&
            Number(value) >= 1 &&
            Number(value) <= 8760
          ),
        'SLA must be from 1 to 8760 hours.',
      ),

    can_reject: z.boolean(),
    is_final: z.boolean(),
  })
  .superRefine((values, context) => {
    if (
      values.approver_type === 'role' &&
      values.approver_role === ''
    ) {
      context.addIssue({
        code: 'custom',
        path: ['approver_role'],
        message: 'Approver role is required.',
      })
    }

    if (
      values.approver_type === 'employee' &&
      values.approver_employee_id === ''
    ) {
      context.addIssue({
        code: 'custom',
        path: ['approver_employee_id'],
        message: 'Approver employee is required.',
      })
    }
  })

export type WorkflowStepFormValues = z.infer<
  typeof workflowStepSchema
>