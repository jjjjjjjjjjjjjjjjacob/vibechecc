import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { useConvex } from 'convex/react';
import { api } from '@viberatr/convex';
import type { Id } from '@viberatr/convex/dataModel';

/**
 * Structure describing the outcome of an upload. We return the storage id for
 * later deletion and, if available, a public URL for immediate display.
 */
export interface UploadResult {
  /** Convex storage document identifier for the uploaded file */
  storageId: Id<'_storage'>;
  /** Optional URL that clients can use to render the uploaded asset */
  url?: string;
}

/**
 * Hook that uploads a file directly to Convex storage and fetches a readable
 * URL for it. The hook exposes a tanstack-query mutation for easy consumption.
 */
export function useFileUpload() {
  // Mutation that asks our Convex backend for a temporary upload URL.
  const generateUploadUrl = useConvexMutation(api.files.generateUploadUrl);
  // Convex client used later to fetch the permanent file URL.
  const convex = useConvex();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      // Request a pre-signed upload URL from the server.
      const uploadUrl = await generateUploadUrl();

      // POST the raw file bytes directly to Convex's upload endpoint.
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Surface a friendly error if the upload fails.
      if (!response.ok) {
        throw new Error('failed to upload file');
      }

      // Parse the JSON response to grab the storage id assigned by Convex.
      const result = (await response.json()) as { storageId: Id<'_storage'> };
      const storageId = result.storageId;

      // Query for a publicly accessible URL which we can show to the user.
      const url = await convex.query(api.files.getUrl, { storageId });

      // Return both the storage id and the URL (if available) to the caller.
      return { storageId, url: url || undefined };
    },
  });
}
