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
import type * as cleanupSearchHistory from "../cleanupSearchHistory.js";
import type * as debugSearchHistory from "../debugSearchHistory.js";
import type * as emojiMetadata from "../emojiMetadata.js";
import type * as emojiRatings from "../emojiRatings.js";
import type * as emojis from "../emojis.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as importEmojis from "../importEmojis.js";
import type * as lib_emojiColors from "../lib/emojiColors.js";
import type * as lib_securityValidators from "../lib/securityValidators.js";
import type * as notifications from "../notifications.js";
import type * as ratings from "../ratings.js";
import type * as search_fuzzy_search from "../search/fuzzy_search.js";
import type * as search_search_scorer from "../search/search_scorer.js";
import type * as search_search_utils from "../search/search_utils.js";
import type * as search from "../search.js";
import type * as searchImproved from "../searchImproved.js";
import type * as searchOptimized from "../searchOptimized.js";
import type * as searchV2 from "../searchV2.js";
import type * as search_backup from "../search_backup.js";
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
  "analytics/search_metrics": typeof analytics_search_metrics;
  cleanupSearchHistory: typeof cleanupSearchHistory;
  debugSearchHistory: typeof debugSearchHistory;
  emojiMetadata: typeof emojiMetadata;
  emojiRatings: typeof emojiRatings;
  emojis: typeof emojis;
  files: typeof files;
  follows: typeof follows;
  http: typeof http;
  importEmojis: typeof importEmojis;
  "lib/emojiColors": typeof lib_emojiColors;
  "lib/securityValidators": typeof lib_securityValidators;
  notifications: typeof notifications;
  ratings: typeof ratings;
  "search/fuzzy_search": typeof search_fuzzy_search;
  "search/search_scorer": typeof search_search_scorer;
  "search/search_utils": typeof search_search_utils;
  search: typeof search;
  searchImproved: typeof searchImproved;
  searchOptimized: typeof searchOptimized;
  searchV2: typeof searchV2;
  search_backup: typeof search_backup;
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
