import { z } from 'zod'

const today = new Date()
today.setHours(0, 0, 0, 0)

export const employeeSchema = z.object({
  department_id: z.string(),
  manager_id: z.string(),

  employee_number: z
    .string()
    .trim()
    .min(1, 'Employee number is required.')
    .max(50, 'Employee number is too long.'),

  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'First name is too long.'),

  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(100, 'Last name is too long.'),

  job_title: z
    .string()
    .trim()
    .max(150, 'Job title is too long.'),

  work_email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        z.string().email().safeParse(value).success,
      'Enter a valid work email.',
    )
    .refine(
      (value) => value.length <= 255,
      'Work email is too long.',
    ),

  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long.'),

  hire_date: z
    .string()
    .refine((value) => {
      if (value === '') {
        return true
      }

      const date = new Date(`${value}T00:00:00`)

      return (
        !Number.isNaN(date.getTime()) &&
        date.getTime() <= today.getTime()
      )
    }, 'Hire date cannot be in the future.'),

  employment_type: z.enum([
    'full_time',
    'part_time',
    'contract',
    'intern',
  ]),

  status: z.enum([
    'active',
    'inactive',
    'on_leave',
  ]),

  avatar: z
    .string()
    .trim()
    .max(255, 'Avatar value is too long.'),

  notes: z
    .string()
    .trim()
    .max(5000, 'Notes are too long.'),
})

export type EmployeeFormValues = z.infer<
  typeof employeeSchema
>