/**
 * errorLogger.ts
 *
 * Production-grade, offline-first error logging service.
 *
 * Features:
 *  - Structured categorization (API, Database, UI, Navigation, Service, Unknown)
 *  - Severity levels (low, medium, high, critical)
 *  - Captures stack traces, screen/action context, and device metadata
 *  - Persists to WatermelonDB for offline-first reliability
 *  - Write queue to prevent concurrent WatermelonDB write conflicts
 *  - Automatic stack trace truncation to keep DB rows lean
 *  - Log rotation: keeps only the last MAX_LOG_COUNT entries
 *  - DEV mode also logs to console for immediate developer feedback
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import type { Database } from "@nozbe/watermelondb";
import ErrorLog from "../db/models/ErrorLog";
import { Q } from "@nozbe/watermelondb";

/**
 * Lazy getter for the WatermelonDB instance.
 * Using a getter instead of a top-level import breaks the circular
 * dependency: db/index → errorLogger → db/index.
 * By the time any logger function is actually called, both modules
 * will have finished initialising.
 */
function getDatabase(): Database {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../db").database as Database;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ErrorCategory {
  API        = "API",
  Database   = "Database",
  UI         = "UI",
  Navigation = "Navigation",
  Service    = "Service",
  Unknown    = "Unknown",
}

export enum ErrorSeverity {
  Low      = "low",
  Medium   = "medium",
  High     = "high",
  Critical = "critical",
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogErrorOptions {
  /** Which part of the app the error came from. */
  category: ErrorCategory;
  /** Impact level — used to prioritise during debugging. */
  severity?: ErrorSeverity;
  /**
   * Short machine-readable code for fast filtering.
   * e.g. "ERR_FETCH_TRIPS", "ERR_DB_WRITE_TRAVEL", "ERR_RENDER_HOME"
   */
  errorCode?: string;
  /** Screen or component name where the error occurred. */
  screen?: string;
  /** User action that triggered the error, e.g. "save_expense". */
  action?: string;
  /**
   * Any extra context (IDs, payloads, etc.).
   * Will be JSON-serialised — keep it small.
   */
  contextData?: Record<string, unknown>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_STACK_LENGTH = 2000; // chars
const MAX_LOG_COUNT    = 500;  // rotate after this many entries

// ─── Internal write queue ─────────────────────────────────────────────────────
// WatermelonDB cannot handle concurrent `database.write()` calls gracefully, so
// we serialize all writes through a simple promise chain.

let writeQueue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): void {
  writeQueue = writeQueue.then(task).catch(() => {
    // Swallow queue errors so the chain never breaks
  });
}

// ─── Device metadata (computed once) ─────────────────────────────────────────

let _deviceInfo: string | undefined;

function getDeviceInfo(): string {
  if (_deviceInfo) return _deviceInfo;
  _deviceInfo = JSON.stringify({
    platform: Platform.OS,
    version: Platform.Version,
    brand: (Platform as any).Brand ?? undefined,
    model: (Platform as any).Model ?? undefined,
  });
  return _deviceInfo;
}

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "unknown";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * logError — fire-and-forget error logger.
 *
 * Safe to call anywhere; never throws; uses a write queue to prevent DB
 * concurrency issues.
 *
 * @example
 * logError(new Error("fetch failed"), {
 *   category: ErrorCategory.API,
 *   severity: ErrorSeverity.High,
 *   errorCode: "ERR_FETCH_TRIPS",
 *   screen: "HomeScreen",
 *   action: "load_travels",
 *   contextData: { travelId: "abc123" },
 * });
 */
export function logError(
  error: unknown,
  options: LogErrorOptions
): void {
  const {
    category,
    severity = ErrorSeverity.Medium,
    errorCode,
    screen,
    action,
    contextData,
  } = options;

  const err = error instanceof Error ? error : new Error(String(error));

  const message    = err.message || "Unknown error";
  const stackTrace = err.stack
    ? err.stack.slice(0, MAX_STACK_LENGTH)
    : undefined;

  // DEV: also log to console for immediate feedback
  if (__DEV__) {
    const prefix = `[${category}][${severity.toUpperCase()}]${errorCode ? ` (${errorCode})` : ""}`;
    console.error(`${prefix} ${message}`, contextData ?? "");
    if (err.stack) console.error(err.stack);
  }

  enqueue(async () => {
    try {
      const db = getDatabase();
      await db.write(async () => {
        await db.get<ErrorLog>("error_logs").create((log) => {
          log.category    = category;
          log.severity    = severity;
          log.errorCode   = errorCode ?? null;
          log.message     = message;
          log.stackTrace  = stackTrace ?? null;
          log.screen      = screen ?? null;
          log.action      = action ?? null;
          log.contextData = contextData ? JSON.stringify(contextData) : null;
          log.appVersion  = getAppVersion();
          log.platform    = Platform.OS;
          log.deviceInfo  = getDeviceInfo();
          log.isResolved  = false;
          log.resolvedNote = null;
        });
      });

      // Log rotation — run outside the write above to avoid nesting writes
      await pruneOldLogs();
    } catch {
      // Absolute last resort — if even the logger fails, swallow silently
    }
  });
}

/**
 * Convenience wrappers for common scenarios.
 */
export const logger = {
  api(error: unknown, options?: Partial<LogErrorOptions>) {
    logError(error, {
      category: ErrorCategory.API,
      severity: ErrorSeverity.High,
      ...options,
    });
  },
  db(error: unknown, options?: Partial<LogErrorOptions>) {
    logError(error, {
      category: ErrorCategory.Database,
      severity: ErrorSeverity.Critical,
      ...options,
    });
  },
  ui(error: unknown, options?: Partial<LogErrorOptions>) {
    logError(error, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.Medium,
      ...options,
    });
  },
  service(error: unknown, options?: Partial<LogErrorOptions>) {
    logError(error, {
      category: ErrorCategory.Service,
      severity: ErrorSeverity.High,
      ...options,
    });
  },
  nav(error: unknown, options?: Partial<LogErrorOptions>) {
    logError(error, {
      category: ErrorCategory.Navigation,
      severity: ErrorSeverity.Low,
      ...options,
    });
  },
};

// ─── Log rotation ─────────────────────────────────────────────────────────────

async function pruneOldLogs(): Promise<void> {
  try {
    const db = getDatabase();
    const count = await db.get<ErrorLog>("error_logs").query().fetchCount();
    if (count <= MAX_LOG_COUNT) return;

    const excess = count - MAX_LOG_COUNT;
    // Fetch oldest entries (smallest created_at) to delete
    const oldLogs = await db
      .get<ErrorLog>("error_logs")
      .query(Q.sortBy("created_at", Q.asc), Q.take(excess))
      .fetch();

    await db.write(async () => {
      for (const log of oldLogs) {
        await log.destroyPermanently();
      }
    });
  } catch {
    // Silent — rotation failure should never affect the app
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/** Fetch all unresolved error logs, newest first. */
export async function getUnresolvedLogs(): Promise<ErrorLog[]> {
  return getDatabase()
    .get<ErrorLog>("error_logs")
    .query(
      Q.where("is_resolved", false),
      Q.sortBy("created_at", Q.desc)
    )
    .fetch();
}

/** Fetch logs by category and/or severity for diagnostics screens. */
export async function getLogsByFilter(options: {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  limit?: number;
}): Promise<ErrorLog[]> {
  const conditions = [];
  if (options.category) conditions.push(Q.where("category", options.category));
  if (options.severity) conditions.push(Q.where("severity", options.severity));

  const query = getDatabase()
    .get<ErrorLog>("error_logs")
    .query(
      ...(conditions.length ? [Q.and(...conditions)] : []),
      Q.sortBy("created_at", Q.desc),
      ...(options.limit ? [Q.take(options.limit)] : [])
    );

  return query.fetch();
}

/** Mark a log as resolved with an optional note. */
export async function resolveLog(id: string, note?: string): Promise<void> {
  const db = getDatabase();
  await db.write(async () => {
    const log = await db.get<ErrorLog>("error_logs").find(id);
    await log.update((l) => {
      l.isResolved   = true;
      l.resolvedNote = note ?? null;
    });
  });
}

/** Delete all resolved logs (maintenance utility). */
export async function clearResolvedLogs(): Promise<void> {
  const db = getDatabase();
  const resolved = await db
    .get<ErrorLog>("error_logs")
    .query(Q.where("is_resolved", true))
    .fetch();

  await db.write(async () => {
    for (const log of resolved) {
      await log.destroyPermanently();
    }
  });
}
