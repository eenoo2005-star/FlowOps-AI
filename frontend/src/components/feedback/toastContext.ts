import { createContext, useContext } from 'react'

export type ToastKind =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

export interface ToastInput {
  title: string
  message?: string
  kind?: ToastKind
}

export interface ToastApi {
  show: (toast: ToastInput) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

export const ToastContext =
  createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const value = useContext(ToastContext)

  if (!value) {
    throw new Error(
      'useToast must be used within ToastProvider',
    )
  }

  return value
}