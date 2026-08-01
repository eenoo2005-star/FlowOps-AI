<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RequestAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'sha256' => $this->sha256,
            'uploaded_by_name' => $this->uploaded_by_name,

            'can_download' => $user?->can(
                'request-attachments.download'
            ) ?? false,

            'can_delete' => $user !== null
                && (
                    $user->can(
                        'request-attachments.manage'
                    )
                    || (
                        $this->uploaded_by_user_id
                            === $user->id
                        && $user->can(
                            'request-attachments.delete_own'
                        )
                    )
                ),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
