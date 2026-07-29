export interface AuthUser {
  id: number
  company_id: number | null
  name: string
  email: string
  roles: string[]
  permissions?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
}

export interface LoginResponse {
  message: string
  token: string
  token_type: 'Bearer'
  user: AuthUser
}