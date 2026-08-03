import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from 'lucide-react'
import {
  ToastContext,
  type ToastApi,
  type ToastInput,
  type ToastKind,
} from './toastContext'

interface ToastItem extends ToastInput {
  id: number
  kind: ToastKind
}

const icons = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: AlertTriangle,
  info: Info,
}

export function ToastProvider({
  children,
}: {
  children: ReactNode
}) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    )
  }, [])

  const show = useCallback(
    (toast: ToastInput) => {
      const id = Date.now() + Math.random()

      const item: ToastItem = {
        ...toast,
        id,
        kind: toast.kind ?? 'info',
      }

      setItems((current) => [...current, item])

      window.setTimeout(() => {
        dismiss(id)
      }, 4500)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, message) =>
        show({ title, message, kind: 'success' }),
      error: (title, message) =>
        show({ title, message, kind: 'error' }),
      warning: (title, message) =>
        show({ title, message, kind: 'warning' }),
      info: (title, message) =>
        show({ title, message, kind: 'info' }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="flow-toast-region"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => {
          const Icon = icons[item.kind]

          return (
            <article
              key={item.id}
              className={`flow-toast flow-toast-${item.kind}`}
              role={
                item.kind === 'error'
                  ? 'alert'
                  : 'status'
              }
            >
              <Icon size={20} />

              <div>
                <strong>{item.title}</strong>

                {item.message && <p>{item.message}</p>}
              </div>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </article>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}