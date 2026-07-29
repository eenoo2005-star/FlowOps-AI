import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid work email address.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>