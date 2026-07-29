import apiClient from '../api/client'
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
} from '../types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/login',
      credentials,
    )

    return response.data
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<{ data: AuthUser }>('/user')

    return response.data.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/logout')
  },
}