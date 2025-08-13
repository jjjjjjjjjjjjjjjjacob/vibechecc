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
import type * as analytics_search_metrics from "../analytics/search-metrics.js";
import type * as cleanup_search_history from "../cleanup-search-history.js";
import type * as debug_search_history from "../debug-search-history.js";
import type * as emoji_metadata from "../emoji-metadata.js";
import type * as emojiRatings from "../emojiRatings.js";
import type * as emojis from "../emojis.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as import_emojis from "../import-emojis.js";
import type * as lib_emoji_colors from "../lib/emoji-colors.js";
import type * as lib_security_validators from "../lib/security-validators.js";
import type * as notifications from "../notifications.js";
import type * as ratings from "../ratings.js";
import type * as search_fuzzy_search from "../search/fuzzy-search.js";
import type * as search_search_utils from "../search/search-utils.js";
import type * as search_search_scorer from "../search/search_scorer.js";
import type * as search_backup from "../search-backup.js";
import type * as search_improved from "../search-improved.js";
import type * as search_optimized from "../search-optimized.js";
import type * as search_v2 from "../search-v2.js";
import type * as search from "../search.js";
import type * as seed_emojis_activities from "../seed/emojis/activities.js";
import type * as seed_emojis_animals from "../seed/emojis/animals.js";
import type * as seed_emojis_food from "../seed/emojis/food.js";
import type * as seed_emojis_objects from "../seed/emojis/objects.js";
import type * as seed_emojis_people from "../seed/emojis/people.js";
import type * as seed_emojis_smileys from "../seed/emojis/smileys.js";
import type * as seed_emojis_symbols from "../seed/emojis/symbols.js";
import type * as seed_emojis_travel from "../seed/emojis/travel.js";
import type * as seed from "../seed.js";
import type * as tags from "../tags.js";
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
  "analytics/search-metrics": typeof analytics_search_metrics;
  "cleanup-search-history": typeof cleanup_search_history;
  "debug-search-history": typeof debug_search_history;
  "emoji-metadata": typeof emoji_metadata;
  emojiRatings: typeof emojiRatings;
  emojis: typeof emojis;
  files: typeof files;
  follows: typeof follows;
  http: typeof http;
  "import-emojis": typeof import_emojis;
  "lib/emoji-colors": typeof lib_emoji_colors;
  "lib/security-validators": typeof lib_security_validators;
  notifications: typeof notifications;
  ratings: typeof ratings;
  "search/fuzzy-search": typeof search_fuzzy_search;
  "search/search-utils": typeof search_search_utils;
  "search/search_scorer": typeof search_search_scorer;
  "search-backup": typeof search_backup;
  "search-improved": typeof search_improved;
  "search-optimized": typeof search_optimized;
  "search-v2": typeof search_v2;
  search: typeof search;
  "seed/emojis/activities": typeof seed_emojis_activities;
  "seed/emojis/animals": typeof seed_emojis_animals;
  "seed/emojis/food": typeof seed_emojis_food;
  "seed/emojis/objects": typeof seed_emojis_objects;
  "seed/emojis/people": typeof seed_emojis_people;
  "seed/emojis/smileys": typeof seed_emojis_smileys;
  "seed/emojis/symbols": typeof seed_emojis_symbols;
  "seed/emojis/travel": typeof seed_emojis_travel;
  seed: typeof seed;
  tags: typeof tags;
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
