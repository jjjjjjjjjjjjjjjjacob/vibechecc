import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { Id } from '@viberatr/convex/dataModel';

/**
 * Resolve the appropriate image URL for a given vibe record. The vibe may
 * already contain a direct URL or a storage id; this hook abstracts that
 * decision and always returns a URL the UI can display.
 */
export function useVibeImageUrl(vibe: {
  image?: string;
  imageStorageId?: string | Id<'_storage'>;
}) {
  // Helper used to heuristically determine if a string resembles a Convex
  // storage id. This lets us differentiate between URLs and ids stored in the
  // same field.
  const isStorageId = (str: string) => {
    // Convex storage ids are typically 32 character alphanumeric strings.
    return str && /^[a-z0-9]{32}$/.test(str);
  };

  // Decide which storage id to query. Prefer the explicit `imageStorageId`
  // field, falling back to `image` if it looks like an id rather than a URL.
  const storageId =
    (vibe.imageStorageId as Id<'_storage'>) ||
    (vibe.image && isStorageId(vibe.image)
      ? (vibe.image as Id<'_storage'>)
      : undefined);

  // Always define the react-query hook but only enable it when we have an id
  // to fetch; this avoids violating the rules of hooks while still skipping
  // network calls when unnecessary.
  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.files.getUrl, { storageId }),
    enabled: !!storageId,
  });

  // If the `image` field already contains a URL, short-circuit and return it
  // directly to avoid an extra round-trip.
  if (vibe.image && !isStorageId(vibe.image)) {
    return { data: vibe.image, isLoading: false, error: null };
  }

  // Otherwise rely on the Convex query result. Consumers will handle loading
  // and error states as needed.
  return { data, isLoading, error };
}
