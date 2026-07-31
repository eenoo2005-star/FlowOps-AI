import { z } from 'zod'

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Department name is required.')
    .max(255, 'Department name is too long.'),

  code: z
    .string()
    .trim()
    .min(1, 'Department code is required.')
    .max(50, 'Department code is too long.')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Use letters, numbers, hyphens or underscores.',
    ),

  description: z
    .string()
    .trim()
    .max(2000, 'Description is too long.'),

  is_active: z.boolean(),
})

export type DepartmentFormValues = z.infer<
  typeof departmentSchema
>