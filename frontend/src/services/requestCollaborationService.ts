import apiClient from '../api/client'
import type {
  RequestAttachment,
  RequestCollaborationData,
  RequestComment,
} from '../types/requestCollaboration'

export const requestCollaborationService = {
  async overview(
    requestId: number,
  ): Promise<RequestCollaborationData> {
    const response = await apiClient.get<{
      data: RequestCollaborationData
    }>(
      `/internal-requests/${requestId}/collaboration`,
    )

    return response.data.data
  },

  async addComment(
    requestId: number,
    body: string,
  ): Promise<RequestComment> {
    const response = await apiClient.post<{
      data: RequestComment
    }>(
      `/internal-requests/${requestId}/comments`,
      { body },
    )

    return response.data.data
  },

  async deleteComment(
    requestId: number,
    commentId: number,
  ): Promise<void> {
    await apiClient.delete(
      `/internal-requests/${requestId}/comments/${commentId}`,
    )
  },

  async uploadAttachment(
    requestId: number,
    file: File,
  ): Promise<RequestAttachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<{
      data: RequestAttachment
    }>(
      `/internal-requests/${requestId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data.data
  },

  async downloadAttachment(
    requestId: number,
    attachmentId: number,
  ): Promise<Blob> {
    const response = await apiClient.get(
      `/internal-requests/${requestId}/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      },
    )

    return response.data as Blob
  },

  async deleteAttachment(
    requestId: number,
    attachmentId: number,
  ): Promise<void> {
    await apiClient.delete(
      `/internal-requests/${requestId}/attachments/${attachmentId}`,
    )
  },
}