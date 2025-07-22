/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics_search_metrics from "../analytics/search_metrics.js";
import type * as emojiMetadata from "../emojiMetadata.js";
import type * as emojiRatings from "../emojiRatings.js";
import type * as http from "../http.js";
import type * as migrations_migrateEmojiRatings from "../migrations/migrateEmojiRatings.js";
import type * as search_fuzzy_search from "../search/fuzzy_search.js";
import type * as search_search_scorer from "../search/search_scorer.js";
import type * as search_search_utils from "../search/search_utils.js";
import type * as search from "../search.js";
import type * as seed_emojiMetadata from "../seed/emojiMetadata.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as vibes from "../vibes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "analytics/search_metrics": typeof analytics_search_metrics;
  emojiMetadata: typeof emojiMetadata;
  emojiRatings: typeof emojiRatings;
  http: typeof http;
  "migrations/migrateEmojiRatings": typeof migrations_migrateEmojiRatings;
  "search/fuzzy_search": typeof search_fuzzy_search;
  "search/search_scorer": typeof search_search_scorer;
  "search/search_utils": typeof search_search_utils;
  search: typeof search;
  "seed/emojiMetadata": typeof seed_emojiMetadata;
  seed: typeof seed;
  users: typeof users;
  vibes: typeof vibes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
