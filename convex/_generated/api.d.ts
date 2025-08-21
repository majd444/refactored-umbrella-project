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
import type * as agents from "../agents.js";
import type * as chat from "../chat.js";
import type * as chatWidget from "../chatWidget.js";
import type * as fineTuning from "../fineTuning.js";
import type * as sessions from "../sessions.js";
import type * as test from "../test.js";
import type * as testQueries from "../testQueries.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  chat: typeof chat;
  chatWidget: typeof chatWidget;
  fineTuning: typeof fineTuning;
  sessions: typeof sessions;
  test: typeof test;
  testQueries: typeof testQueries;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
