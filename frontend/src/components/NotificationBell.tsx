import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../services/notificationService'

interface NotificationBellProps {
  enabled: boolean
}

function NotificationBell({
  enabled,
}: NotificationBellProps) {
  const navigate = useNavigate()

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationService.unreadCount,
    enabled,
    refetchInterval: 30_000,
    retry: false,
  })

  const unreadCount = unreadQuery.data ?? 0

  return (
    <button
      type="button"
      onClick={() => navigate('/notifications')}
      disabled={!enabled}
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950/60 text-slate-500 transition hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Open notifications"
    >
      <Bell size={17} />

      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-sky-400 px-1 text-[9px] font-bold text-slate-950">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default NotificationBell