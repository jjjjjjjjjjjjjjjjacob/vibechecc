import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { useConvex } from 'convex/react';
import { api } from '@viberater/convex';
import type { Id } from '@viberater/convex/dataModel';

export interface UploadResult {
  storageId: Id<'_storage'>;
  url?: string;
}

export function useFileUpload() {
  const generateUploadUrl = useConvexMutation(api.files.generateUploadUrl);
  const convex = useConvex();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = (await response.json()) as { storageId: Id<'_storage'> };
      const storageId = result.storageId;

      // Get the file URL for display using query
      const url = await convex.query(api.files.getUrl, { storageId });

      return { storageId, url: url || undefined };
    },
  });
}
