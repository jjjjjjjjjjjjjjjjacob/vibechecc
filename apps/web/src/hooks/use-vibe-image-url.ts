import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { Id } from '@vibechecc/convex/dataModel';

export function useVibeImageUrl(vibe: {
  image?: string;
  imageStorageId?: string | Id<'_storage'>;
}) {
  // Helper function to check if a string looks like a storage ID
  const isStorageId = (str: string) => {
    // Convex storage IDs are typically 32 character alphanumeric strings
    return str && /^[a-z0-9]{32}$/.test(str);
  };

  // Determine which storage ID to use
  const storageId =
    (vibe.imageStorageId as Id<'_storage'>) ||
    (vibe.image && isStorageId(vibe.image)
      ? (vibe.image as Id<'_storage'>)
      : undefined);

  // Always call the hook but conditionally enable it
  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.files.getUrl, { storageId }),
    enabled: !!storageId,
  });

  // If we have a direct image URL (not a storage ID), return it
  if (vibe.image && !isStorageId(vibe.image)) {
    return { data: vibe.image, isLoading: false, error: null };
  }

  // Otherwise return the query result
  return { data, isLoading, error };
}
