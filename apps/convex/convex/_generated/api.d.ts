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
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_emojis from "../admin/emojis.js";
import type * as admin_reviews from "../admin/reviews.js";
import type * as admin_setup from "../admin/setup.js";
import type * as admin_tags from "../admin/tags.js";
import type * as admin_users from "../admin/users.js";
import type * as admin_vibes from "../admin/vibes.js";
import type * as analytics_searchMetrics from "../analytics/searchMetrics.js";
import type * as cleanupSearchHistory from "../cleanupSearchHistory.js";
import type * as debugSearchHistory from "../debugSearchHistory.js";
import type * as emojiMetadata from "../emojiMetadata.js";
import type * as emojiRatings from "../emojiRatings.js";
import type * as emojis from "../emojis.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as lib_emojiColors from "../lib/emojiColors.js";
import type * as lib_securityValidators from "../lib/securityValidators.js";
import type * as migrations_import_emoji_mart_data from "../migrations/import_emoji_mart_data.js";
import type * as notifications from "../notifications.js";
import type * as ratings from "../ratings.js";
import type * as search_fuzzy_search from "../search/fuzzy_search.js";
import type * as search_search_scorer from "../search/search_scorer.js";
import type * as search_search_utils from "../search/search_utils.js";
import type * as search from "../search.js";
import type * as searchOptimized from "../searchOptimized.js";
import type * as seed from "../seed.js";
import type * as social_connections from "../social/connections.js";
import type * as social_index from "../social/index.js";
import type * as social_sharing from "../social/sharing.js";
import type * as social_urlGeneration from "../social/urlGeneration.js";
import type * as tags from "../tags.js";
import type * as users_admin from "../users/admin.js";
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
  "admin/dashboard": typeof admin_dashboard;
  "admin/emojis": typeof admin_emojis;
  "admin/reviews": typeof admin_reviews;
  "admin/setup": typeof admin_setup;
  "admin/tags": typeof admin_tags;
  "admin/users": typeof admin_users;
  "admin/vibes": typeof admin_vibes;
  "analytics/searchMetrics": typeof analytics_searchMetrics;
  cleanupSearchHistory: typeof cleanupSearchHistory;
  debugSearchHistory: typeof debugSearchHistory;
  emojiMetadata: typeof emojiMetadata;
  emojiRatings: typeof emojiRatings;
  emojis: typeof emojis;
  files: typeof files;
  follows: typeof follows;
  http: typeof http;
  internal: typeof internal_;
  "lib/emojiColors": typeof lib_emojiColors;
  "lib/securityValidators": typeof lib_securityValidators;
  "migrations/import_emoji_mart_data": typeof migrations_import_emoji_mart_data;
  notifications: typeof notifications;
  ratings: typeof ratings;
  "search/fuzzy_search": typeof search_fuzzy_search;
  "search/search_scorer": typeof search_search_scorer;
  "search/search_utils": typeof search_search_utils;
  search: typeof search;
  searchOptimized: typeof searchOptimized;
  seed: typeof seed;
  "social/connections": typeof social_connections;
  "social/index": typeof social_index;
  "social/sharing": typeof social_sharing;
  "social/urlGeneration": typeof social_urlGeneration;
  tags: typeof tags;
  "users/admin": typeof users_admin;
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
