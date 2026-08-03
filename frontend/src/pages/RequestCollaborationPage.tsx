import {
  type FormEvent,
  useRef,
  useState,
} from 'react'
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Download,
  FileArchive,
  FileText,
  History,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { useToast } from '../components/feedback/toastContext'
import { authService } from '../services/authService'
import { internalRequestService } from '../services/internalRequestService'
import { requestCollaborationService } from '../services/requestCollaborationService'
import type {
  RequestAttachment,
  RequestAuditEvent,
} from '../types/requestCollaboration'

interface ErrorPayload {
  message?: string
  errors?: Record<string, string[]>
}

function extractError(error: unknown): string {
  const axiosError =
    error as AxiosError<ErrorPayload>

  const validation =
    axiosError.response?.data?.errors

  return (
    (validation
      ? Object.values(validation).flat()[0]
      : null) ??
    axiosError.response?.data?.message ??
    'The operation could not be completed.'
  )
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`
}

function auditIcon(event: RequestAuditEvent) {
  if (event.event_type.startsWith('attachment.')) {
    return Paperclip
  }

  if (event.event_type.startsWith('comment.')) {
    return MessageSquare
  }

  if (event.event_type.startsWith('approval.')) {
    return ShieldCheck
  }

  return History
}

function RequestCollaborationPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { requestId: requestIdValue } = useParams()
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const requestId = Number(requestIdValue)
  const validRequestId =
    Number.isInteger(requestId) &&
    requestId > 0

  const [comment, setComment] = useState('')
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)
  const [operationError, setOperationError] =
    useState<string | null>(null)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  })

  const requestQuery = useQuery({
    queryKey: ['internal-request', requestId],
    queryFn: () =>
      internalRequestService.show(requestId),
    enabled: validRequestId,
  })

  const collaborationQuery = useQuery({
    queryKey: [
      'request-collaboration',
      requestId,
    ],
    queryFn: () =>
      requestCollaborationService.overview(
        requestId,
      ),
    enabled:
      validRequestId &&
      userQuery.isSuccess,
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          'request-collaboration',
          requestId,
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'internal-request',
          requestId,
        ],
      }),
    ])
  }

  const commentMutation = useMutation({
    mutationFn: (body: string) =>
      requestCollaborationService.addComment(
        requestId,
        body,
      ),

    onSuccess: async () => {
      setComment('')
      setOperationError(null)
      await refresh()
      toast.success('Comment added successfully')
    },

    onError: (error) => {
      const message = extractError(error)
      setOperationError(message)
      toast.error('Comment creation failed', message)
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      requestCollaborationService.deleteComment(
        requestId,
        commentId,
      ),

    onSuccess: async () => {
      await refresh()
      toast.success('Comment deleted successfully')
    },

    onError: (error) => {
      const message = extractError(error)
      setOperationError(message)
      toast.error('Comment deletion failed', message)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      requestCollaborationService.uploadAttachment(
        requestId,
        file,
      ),

    onSuccess: async () => {
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setOperationError(null)
      await refresh()
      toast.success('Attachment uploaded successfully')
    },

    onError: (error) => {
      const message = extractError(error)
      setOperationError(message)
      toast.error('Attachment upload failed', message)
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      requestCollaborationService.deleteAttachment(
        requestId,
        attachmentId,
      ),

    onSuccess: async () => {
      await refresh()
      toast.success('Attachment deleted successfully')
    },

    onError: (error) => {
      const message = extractError(error)
      setOperationError(message)
      toast.error('Attachment deletion failed', message)
    },
  })

  const submitComment = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const body = comment.trim()

    if (body === '') {
      setOperationError(
        'Comment cannot be empty.',
      )

      return
    }

    commentMutation.mutate(body)
  }

  const uploadAttachment = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!selectedFile) {
      setOperationError(
        'Select a file before uploading.',
      )

      return
    }

    uploadMutation.mutate(selectedFile)
  }

  const downloadAttachment = async (
    attachment: RequestAttachment,
  ) => {
    setOperationError(null)

    try {
      const blob =
        await requestCollaborationService
          .downloadAttachment(
            requestId,
            attachment.id,
          )

      const url = URL.createObjectURL(blob)
      const anchor =
        document.createElement('a')

      anchor.href = url
      anchor.download = attachment.original_name
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setOperationError(extractError(error))
    }
  }

  if (!validRequestId) {
    return <Navigate to="/requests" replace />
  }

  if (userQuery.isError) {
    return <Navigate to="/login" replace />
  }

  if (
    userQuery.isPending ||
    requestQuery.isPending ||
    collaborationQuery.isPending
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <LoaderCircle
          size={34}
          className="animate-spin text-sky-400"
        />
      </main>
    )
  }

  if (
    requestQuery.isError ||
    collaborationQuery.isError ||
    !requestQuery.data ||
    !collaborationQuery.data
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-rose-200">
        <div>
          <AlertTriangle
            size={34}
            className="mx-auto"
          />

          <p className="mt-4">
            Request collaboration data could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="mt-5 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Return to requests
          </button>
        </div>
      </main>
    )
  }

  const internalRequest = requestQuery.data
  const collaboration =
    collaborationQuery.data

  return (
    <main className="min-h-screen bg-[#050b18] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex min-h-20 max-w-[1650px] items-center gap-4 px-5 md:px-8">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400 hover:text-sky-300"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
            <MessageSquare size={22} />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Request workspace
            </p>

            <h1 className="font-semibold">
              Collaboration and Audit
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1650px] p-5 md:p-8">
        <section className="rounded-3xl border border-sky-400/10 bg-gradient-to-br from-blue-950/60 via-slate-950 to-cyan-950/30 p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-mono text-xs text-sky-300">
                {internalRequest.reference_number}
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                {internalRequest.title}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                {internalRequest.description ??
                  'No request description was provided.'}
              </p>
            </div>

            <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold uppercase text-sky-300">
              {internalRequest.status.replace(
                '_',
                ' ',
              )}
            </span>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <UserRound
                size={17}
                className="text-sky-300"
              />

              <p className="mt-3 text-sm font-semibold">
                {internalRequest.requester_employee
                  ?.full_name ?? 'Unknown'}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Requester
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <FileText
                size={17}
                className="text-sky-300"
              />

              <p className="mt-3 text-sm font-semibold">
                {internalRequest.request_type?.name ??
                  'Unknown'}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Request type
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <Clock3
                size={17}
                className="text-sky-300"
              />

              <p className="mt-3 text-sm font-semibold">
                {formatDate(
                  internalRequest.submitted_at,
                )}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Submitted
              </p>
            </div>
          </div>
        </section>

        {operationError && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            <AlertTriangle
              size={18}
              className="shrink-0"
            />

            <span>{operationError}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/55">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <MessageSquare
                  size={18}
                  className="text-sky-300"
                />

                <div>
                  <h3 className="font-semibold">
                    Comments
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    {collaboration.comments.length} comments
                  </p>
                </div>
              </div>
            </div>

            {collaboration.permissions.comment && (
              <form
                onSubmit={submitComment}
                className="border-b border-slate-800 p-5"
              >
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Add a request comment..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-700"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={commentMutation.isPending}
                    className="flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {commentMutation.isPending
                      ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        )
                      : <Send size={16} />}

                    Add comment
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[560px] space-y-3 overflow-y-auto p-5">
              {collaboration.comments.length > 0
                ? collaboration.comments.map(
                    (item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">
                              {item.author_name}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-600">
                              {formatDate(
                                item.created_at,
                              )}
                            </p>
                          </div>

                          {item.can_delete && (
                            <button
                              type="button"
                              onClick={() => {
                                const confirmed =
                                  window.confirm(
                                    'Delete this comment?',
                                  )

                                if (confirmed) {
                                  deleteCommentMutation
                                    .mutate(item.id)
                                }
                              }}
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-600 hover:text-rose-300"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                          {item.body}
                        </p>
                      </article>
                    ),
                  )
                : (
                    <div className="grid min-h-40 place-items-center text-sm text-slate-600">
                      No comments yet.
                    </div>
                  )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/55">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <Paperclip
                  size={18}
                  className="text-sky-300"
                />

                <div>
                  <h3 className="font-semibold">
                    Attachments
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    Private files, maximum 10 MB each
                  </p>
                </div>
              </div>
            </div>

            {collaboration.permissions.upload && (
              <form
                onSubmit={uploadAttachment}
                className="border-b border-slate-800 p-5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                  onChange={(event) =>
                    setSelectedFile(
                      event.target.files?.[0] ??
                      null,
                    )
                  }
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                />

                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="truncate text-xs text-slate-600">
                    {selectedFile
                      ? `${selectedFile.name} - ${formatBytes(selectedFile.size)}`
                      : 'No file selected'}
                  </p>

                  <button
                    type="submit"
                    disabled={
                      uploadMutation.isPending ||
                      selectedFile === null
                    }
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {uploadMutation.isPending
                      ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        )
                      : <Upload size={16} />}

                    Upload
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[560px] space-y-3 overflow-y-auto p-5">
              {collaboration.attachments.length > 0
                ? collaboration.attachments.map(
                    (attachment) => (
                      <article
                        key={attachment.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                            <FileArchive size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {attachment.original_name}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-600">
                              {formatBytes(
                                attachment.size,
                              )}
                              {' - '}
                              {attachment.uploaded_by_name}
                              {' - '}
                              {formatDate(
                                attachment.created_at,
                              )}
                            </p>

                            <p className="mt-2 truncate font-mono text-[10px] text-slate-700">
                              SHA-256: {attachment.sha256}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {attachment.can_download && (
                              <button
                                type="button"
                                onClick={() =>
                                  void downloadAttachment(
                                    attachment,
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-sky-300"
                              >
                                <Download size={15} />
                              </button>
                            )}

                            {attachment.can_delete && (
                              <button
                                type="button"
                                onClick={() => {
                                  const confirmed =
                                    window.confirm(
                                      `Delete "${attachment.original_name}"?`,
                                    )

                                  if (confirmed) {
                                    deleteAttachmentMutation
                                      .mutate(
                                        attachment.id,
                                      )
                                  }
                                }}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500 hover:text-rose-300"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ),
                  )
                : (
                    <div className="grid min-h-40 place-items-center text-sm text-slate-600">
                      No attachments yet.
                    </div>
                  )}
            </div>
          </section>
        </div>

        {collaboration.permissions.view_audit && (
          <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/55">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <History
                  size={18}
                  className="text-sky-300"
                />

                <div>
                  <h3 className="font-semibold">
                    Immutable audit timeline
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    {collaboration.audit_events.length} recorded events
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {collaboration.audit_events.length > 0
                ? collaboration.audit_events.map(
                    (event) => {
                      const EventIcon =
                        auditIcon(event)

                      return (
                        <article
                          key={event.id}
                          className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                            <EventIcon size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">
                                  {event.summary}
                                </p>

                                <p className="mt-1 font-mono text-[10px] text-slate-700">
                                  {event.event_type}
                                </p>
                              </div>

                              <p className="text-[11px] text-slate-600">
                                {formatDate(
                                  event.occurred_at,
                                )}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                              <span>
                                Actor:{' '}
                                {event.actor_name ??
                                  'System'}
                              </span>

                              {event.ip_address && (
                                <span>
                                  IP: {event.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    },
                  )
                : (
                    <div className="grid min-h-40 place-items-center text-sm text-slate-600">
                      No audit events are available.
                    </div>
                  )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default RequestCollaborationPage