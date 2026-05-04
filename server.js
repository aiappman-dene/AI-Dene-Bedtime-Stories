import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server's own directory so the server boots correctly
// regardless of the working directory it was started from.
dotenv.config({ path: path.join(__dirname, ".env") });

function logEvent(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

const PUBLIC_DIR = path.join(__dirname, "public");
const POLISH_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const POLISH_LIMIT_MAX = 10;
// Locale validation helper
function isSupportedStoryLocale(lang) {
  const supported = [
    "en", "en-GB", "en-US",
    "fr", "es", "de", "it",
    "ja", "zh", "hi"
  ];
  return supported.includes(lang);
}
// =============================================================================
// DreamTalez — Server
// AI-powered bedtime story generator for children aged 2–12
// =============================================================================


import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { applicationDefault, cert, getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ✅ Rate limiter for /generate (IP-based)
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

// Per-user sliding window rate limiter (in-memory, resets on restart)
const userRequests = new Map();
const activeRequests = new Set();

function isRateLimited(userId) {
  const now = Date.now();
  const windowMs = 10000;
  const maxRequests = 3;

  const timestamps = (userRequests.get(userId) || []).filter(t => now - t < windowMs);
  timestamps.push(now);
  userRequests.set(userId, timestamps);

  return timestamps.length > maxRequests;
}

// =============================
// Middleware definitions
// =============================
// Allowed origins are sourced from ALLOWED_ORIGINS (comma-separated) so we
// never deploy production with cors({ origin: "*" }) — a wildcard CORS would
// let any website on the internet trigger story generation against this
// server using a victim's stored Firebase token, draining Claude credits.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header → same-origin browser request, curl, or a native
    // mobile app (Capacitor uses capacitor:// which omits Origin). Allow it.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // In dev with no allowlist configured, accept anything so local testing
    // doesn't require fiddling with env. Production preflight refuses to
    // boot when the allowlist is empty, so this branch is dev-only.
    if (process.env.NODE_ENV !== "production" && ALLOWED_ORIGINS.length === 0) {
      return callback(null, true);
    }
    logEvent(`Blocked by CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});
import { body, validationResult } from "express-validator";
import fs from "fs";
import https from "https";
import crypto from "crypto";




import {
  STORY_SYSTEM_PROMPT,
  EDITOR_SYSTEM_PROMPT,
  VALIDATOR_SYSTEM_PROMPT,
  DELIVERY_QA_SYSTEM_PROMPT,
  buildStoryPrompt,
  buildGrammarPrompt,
  buildValidationPrompt,
  buildDeliveryQaPrompt,
  buildTitlePrompt,
  resolveLanguageCode,
  getDialectInstruction,
} from "./prompts.js";

import {
  normalizeStoryOutput,
  detectStoryQualityIssues,
  assertStoryQuality,
  isStoryValid,
} from "./story-quality.js";
import { createCheckoutSession, handleWebhook, validateAndConsumeGuestOneoff } from "./stripe.js";

// =============================================================================
// Environment / config
// =============================================================================
// Accept either ANTHROPIC_API_KEY (canonical) or CLAUDE_API_KEY (alias),
// matching what .env.example documents. Trim whitespace because copy/paste
// from dashboards often appends a stray newline that silently breaks auth.
const API_KEY = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "").trim();
const AI_ENABLED = API_KEY.startsWith("sk-ant-");
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const REQUIRE_AUTH_FOR_AI_ROUTES = process.env.REQUIRE_AUTH_FOR_AI_ROUTES !== "false";
const USE_FULL_AI_PIPELINE = process.env.USE_FULL_AI_PIPELINE === "true" || process.env.AI_PIPELINE_PROFILE === "full";

// Developer accounts — credit gate is always bypassed for these emails
const DEVELOPER_EMAILS = new Set([
  "dene2012@hotmail.co.uk",
]);


// =============================
// App init
// =============================
const app = express();
// generateLimiter is applied per-route below (not globally) to avoid double-firing


// =============================
// Rate limiting — applied ONLY to API routes below, never to static assets.
// Static files (app.js, CSS, HTML) must always load without limit-based throttling.
// Duplicate generateLimiter declaration removed. The definition at the top is used.

// Use middleware globally
// =============================
app.use(corsMiddleware);




function normalizeGenerateMode(mode) {
  switch (mode) {
    case "sleepy":
    case "long-surprise":
    case "medium-surprise":
      return "random";
    case "therapeutic":
    case "custom":
      return "hero";
    default:
      return mode;
  }
}

// Helper: Hash an IP address for rate-limit key generation
function ipKeyGenerator(ip) {
  return crypto.createHash("sha256").update(ip || "").digest("hex").substring(0, 16);
}

// Helper: Return token budget based on story length and pipeline stage
function getStoryTokenBudget(length, stage, dialect) {
  const isNonEnglish = dialect && !["en", "en-GB", "en-US", "en-gb", "en-us"].includes(dialect);
  const budgets = {
    short:  { story: 700,  editor: 700,  validator: 700,  title: 40,  delivery: 600 },
    medium: { story: 1800, editor: 1800, validator: 1800, title: 40,  delivery: 1600 },
    long:   { story: 3200, editor: 3200, validator: 3200, title: 40,  delivery: 2800 },
  };
  const row = budgets[length] ?? budgets.medium;
  const base = row[stage] ?? 1400;
  // Non-English stories may need slightly more tokens
  return isNonEnglish ? Math.ceil(base * 1.15) : base;
}

// Helper: Get Firestore instance
function getFirestoreDb() {
  if (!getApps().length) getAdminAuth(); // ensure admin initialized
  return getFirestore();
}

// =============================================================================
// Subscription helpers
// =============================================================================

function addOneMonth(ts) {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

// Idempotent monthly reset — safe to call on every generate request.
// Returns the (possibly updated) user data so callers avoid a second DB read.
async function ensureSubscriptionFresh(uid, userData, db) {
  if (!userData.isSubscribed) return userData;
  if (Date.now() < (userData.subscriptionEndDate || 0)) return userData;

  const now = Date.now();
  const reset = {
    storiesRemaining: 62,
    subscriptionStartDate: now,
    subscriptionEndDate: addOneMonth(now),
  };
  await db.collection("users").doc(uid).set(reset, { merge: true });
  logEvent(`[SUBSCRIPTION] Monthly reset for ${uid}`);
  return { ...userData, ...reset };
}

// Total paid credits a user has right now — sum, not nullish-coalesce.
// The previous `??` chain hid extras and one-offs whenever storiesRemaining
// was 0 (a real value, not null), so a subscribed user with both buckets
// only saw the first number. Always sum.
function getTotalCredits(userData = {}) {
  const subBucket = Number(userData.storiesRemaining || 0);
  const extras   = Number(userData.extraStoryCredits || 0);
  const oneOff   = userData.oneOffAvailable ? 1 : 0;
  return subBucket + extras + oneOff;
}

// Consume one story credit — checks access and deducts atomically.
// Returns { ok, consumed, message }.
async function consumeStory(uid, userData, db) {
  if (!userData.isSubscribed) {
    if (userData.oneOffAvailable) {
      await db.collection("users").doc(uid).update({ oneOffAvailable: false });
      return { ok: true, consumed: "oneOff" };
    }
    return { ok: false, message: "✨ Unlock a story to begin your child's adventure" };
  }

  if ((userData.storiesRemaining || 0) > 0) {
    await db.collection("users").doc(uid).update({ storiesRemaining: FieldValue.increment(-1) });
    return { ok: true, consumed: "storiesRemaining" };
  }

  if ((userData.extraStoryCredits || 0) > 0) {
    await db.collection("users").doc(uid).update({ extraStoryCredits: FieldValue.increment(-1) });
    return { ok: true, consumed: "extraStoryCredits" };
  }

  return {
    ok: false,
    message: "🌙 Tonight's stories are complete. Continue the magic with 10 more stories, or rest until tomorrow.",
  };
}

// Reverse a consumption on pipeline failure so users aren't charged for broken generations.
async function refundStory(uid, consumed, db) {
  if (!consumed) return;
  if (consumed === "oneOff") {
    await db.collection("users").doc(uid).update({ oneOffAvailable: true });
  } else {
    await db.collection("users").doc(uid).update({ [consumed]: FieldValue.increment(1) });
  }
  logEvent(`[REFUND] ${consumed} refunded for ${uid}`);
}



  // Story generation endpoint
  app.post(
    "/generate",
    corsMiddleware,
    express.json({ limit: "10kb" }),
    requireAiAuth,
    generateLimiter,
    [
      body("name").isString().isLength({ min: 1, max: 50 }).trim(),
      body("age").isString().isLength({ min: 1, max: 10 }).trim(),
      body("interests").isString().isLength({ min: 1, max: 200 }).trim(),
      body("length").isIn(["short", "medium", "long"]),
      body("mode").isIn(["random", "hero", "today", "sleepy", "long-surprise", "therapeutic", "custom", "medium-surprise"]),
      body("dialect").optional().custom(isSupportedStoryLocale),
      body("customIdea").optional().isString().isLength({ max: 200 }).trim(),
      body("therapeuticSituation").optional().isString().isLength({ max: 200 }).trim(),
      body("seriesContext").optional().isString().isLength({ max: 700 }).trim(),
      body("childWish").optional().isString().isLength({ max: 120 }).trim(),
      body("appearance").optional().isString().isLength({ max: 200 }).trim(),
      body("dayBeats").optional().isString().isLength({ max: 400 }).trim(),
      body("dayMood").optional().isString().isLength({ max: 40 }).trim(),
      body("language").optional().isString().isLength({ max: 10 }).trim(),
      body("globalInspiration").optional().isArray({ max: 10 }),
      body("gender").optional().isString().isLength({ max: 20 }).trim(),
      body("siblings").optional().isString().isLength({ max: 100 }).trim(),
      body("family").optional().isString().isLength({ max: 100 }).trim(),
      body("cultural_world").optional().isString().isLength({ max: 100 }).trim(),
      body("recurring_character").optional().isString().isLength({ max: 100 }).trim(),
      body("last_story_summary").optional().isString().isLength({ max: 400 }).trim(),
    ],
    async (req, res) => {
      // Hoisted so the outer catch can release activeRequests if anything
      // throws after we acquired the lock but before the pipeline starts.
      let uid = null;
      let db = null;
      let jobId = null;
      let hasPersistentLock = false;
      try {
        // Fail fast and visibly when AI is unconfigured, instead of accepting
        // the request, creating a job, and letting the client poll a doomed
        // pipeline for ~10 seconds before discovering it. This is the only
        // path that the user-facing UI presents — silent failure here looked
        // like a generic "story didn't generate" with no diagnostic.
        if (!AI_ENABLED) {
          logEvent("Rejecting /generate: AI provider not configured");
          return res.status(503).json({
            error: "Story generation is temporarily unavailable. Please try again shortly.",
            reason: "ai_unconfigured",
          });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logEvent("Validation error: " + JSON.stringify(errors.array()));
          return res.status(400).json({ error: "Please check your input and try again." });
        }

        const { name, age, interests, length, mode, dialect, language, customIdea, therapeuticSituation, seriesContext, childWish, appearance, dayBeats, dayMood, globalInspiration, storyType, gender, siblings, family, cultural_world, recurring_character, last_story_summary } = req.body;
        const cleanName = sanitizeInput(name);
        const cleanAge = sanitizeInput(age);
        const cleanInterests = sanitizeInput(interests);
        const incomingMode = mode;
        const normalizedMode = normalizeGenerateMode(incomingMode);
        // `language` takes priority over legacy `dialect`.
        // Resolve to a canonical code (e.g. "ja", "ar", "en-GB").
        const cleanLanguage = language
          ? resolveLanguageCode(String(language).trim().substring(0, 10))
          : resolveLanguageCode(dialect);
        const cleanDialect = cleanLanguage; // keep existing references working
        const cleanTherapeuticSituation = therapeuticSituation ? sanitizeInput(therapeuticSituation) : null;
        const cleanIdea = customIdea ? sanitizeInput(customIdea) : cleanTherapeuticSituation;
        const cleanSeriesContext = seriesContext
          ? String(seriesContext).replace(/[<>{}\[\]]/g, "").trim().substring(0, 700)
          : null;
        const cleanWish = childWish ? sanitizeInput(childWish) : null;
        const cleanAppearance = appearance ? sanitizeInput(appearance) : null;
        // dayBeats is up to 400 chars — use a longer sanitizer pass
        const cleanBeats = dayBeats
          ? String(dayBeats).replace(/[<>{}\[\]]/g, "").trim().substring(0, 400)
          : null;
        const cleanMood = dayMood ? sanitizeInput(dayMood) : null;
        const cleanGender = gender ? sanitizeInput(gender) : null;
        const cleanSiblings = siblings ? sanitizeInput(siblings) : null;
        const cleanFamily = family ? sanitizeInput(family) : null;
        const cleanCulturalWorld = cultural_world ? sanitizeInput(cultural_world) : null;
        const cleanRecurringCharacter = recurring_character ? sanitizeInput(recurring_character) : null;
        const cleanLastStorySummary = last_story_summary
          ? String(last_story_summary).replace(/[<>{}\[\]]/g, "").trim().substring(0, 400)
          : null;

        const SAFE_MSG = "Let's keep stories kind and magical ✨";

        // XSS / injection check
        if (containsSuspiciousContent(cleanName) || containsSuspiciousContent(cleanInterests)) {
          logEvent(`Blocked suspicious input from ${req.ip}: ${cleanName}`);
          return res.status(400).json({ error: "Invalid input detected." });
        }

        // Child-safety content check on all free-text user fields
        const unsafeFields = [cleanIdea, cleanTherapeuticSituation, cleanWish, cleanBeats, cleanAppearance, cleanMood]
          .filter(Boolean)
          .find(isUnsafeForChildren);

        if (unsafeFields) {
          logEvent(`Blocked unsafe content from ${req.ip}`);
          return res.status(400).json({ error: SAFE_MSG, unsafe: true });
        }

        if (cleanSeriesContext && containsSuspiciousContent(cleanSeriesContext)) {
          logEvent(`Blocked suspicious series context from ${req.ip}`);
          return res.status(400).json({ error: "Invalid input detected." });
        }

        // PAYMENT GATE
        // When REQUIRE_AUTH_FOR_AI_ROUTES is off (local dev) requireAiAuth sets
        // req.authUser to null. Synthesize a stable dev uid so the rate limiter
        // and active-request guard still work without rejecting the request.
        uid = req.authUser?.uid || (REQUIRE_AUTH_FOR_AI_ROUTES ? null : "dev-anon");
        if (!uid) {
          return res.status(401).json({ error: "Please log in to generate stories." });
        }

        // Duplicate request guard — one active generation per user at a time
        if (activeRequests.has(uid)) {
          return res.status(429).json({ error: "✨ Your story is already being created" });
        }

        // Per-user rate limit — max 3 requests per 10s window
        if (isRateLimited(uid)) {
          return res.status(429).json({ error: "🌙 Let the story settle before creating another" });
        }

        activeRequests.add(uid);

        const isDevAccount = req.authUser?.email && DEVELOPER_EMAILS.has(req.authUser.email);
        const isAnonDev = uid === "dev-anon";
        // Bypass the paid-credit check ONLY for:
        //   1. The anonymous local dev user (no Firebase, no real account)
        //   2. Explicitly listed developer emails (DEVELOPER_EMAILS)
        // We deliberately do NOT bypass for "any signed-in user when NODE_ENV
        // is not production" — that previously handed free stories to anyone
        // testing against a dev server, which contradicts the paywall promise.
        const bypassPayment = isAnonDev || isDevAccount;

        // Skip Firestore entirely for the anonymous dev user — Firebase Admin
        // may not even be configured in pure-local development, so the lookup
        // would throw before the pipeline gets a chance to run.
        let userData = {};
        if (!isAnonDev) {
          db = getFirestoreDb();

          // Persisted per-user throttle (survives restarts and scales across instances).
          const persistentRate = await enforcePersistentUserRateLimit(uid, db);
          if (persistentRate.limited) {
            activeRequests.delete(uid);
            return res.status(429).json({ error: "🌙 Let the story settle before creating another" });
          }

          const userSnap = await db.collection("users").doc(uid).get();
          userData = userSnap.exists ? userSnap.data() : {};
          // Monthly subscription reset (idempotent — no-op if still in window)
          userData = await ensureSubscriptionFresh(uid, userData, db);
        }

        // Consume story credit (checks access, deducts atomically).
        // Real users without a paid credit get a 403 below — never a free story.
        const consumption = bypassPayment
          ? { ok: true, consumed: null }
          : await consumeStory(uid, userData, db);
        if (!consumption.ok) {
          activeRequests.delete(uid);
          return res.status(403).json({ error: consumption.message });
        }

        logEvent(`[GENERATE] start uid=${uid} mode=${incomingMode}→${normalizedMode} length=${length} dialect=${cleanDialect} child="${cleanName}"`);

        const cleanGlobalInspiration = Array.isArray(globalInspiration)
          ? globalInspiration
              .slice(0, 5)
              .map((s) => sanitizeInput(String(s || "").trim().substring(0, 100)))
              .filter(Boolean)
          : [];

        const storyInputs = {
          name: cleanName,
          age: cleanAge,
          gender: cleanGender,
          interests: cleanInterests,
          siblings: cleanSiblings,
          family: cleanFamily,
          cultural_world: cleanCulturalWorld,
          recurring_character: cleanRecurringCharacter,
          last_story_summary: cleanLastStorySummary,
          language: cleanLanguage,
        };

        // Create the job record BEFORE responding. The record stores the
        // credit bucket we just consumed, so a server restart mid-pipeline
        // can be refunded by the sweeper from the durable record alone.
        try {
          if (db) {
            const provisionalJobId = crypto.randomUUID();
            const lock = await acquireGenerationLock(uid, provisionalJobId, db);
            if (!lock.ok) {
              await refundStory(uid, consumption.consumed, db).catch(refundErr =>
                logEvent(`[REFUND] lock conflict refund failed uid=${uid}: ${refundErr.message}`)
              );
              activeRequests.delete(uid);
              return res.status(429).json({ error: "✨ Your story is already being created" });
            }
            hasPersistentLock = true;
            jobId = provisionalJobId;
          }

          jobId = await createJob({
            uid,
            db,
            consumed: consumption.consumed,
            jobId,
            ctx: {
              mode: normalizedMode,
              rawMode: incomingMode,
              length,
              cleanName,
              payload: {
                storyInputs,
                pipeline: {
                  mode: normalizedMode,
                  rawMode: incomingMode,
                  cleanName,
                  cleanDialect,
                  cleanInterests,
                  cleanIdea,
                  cleanWish,
                  cleanSeriesContext,
                  cleanBeats,
                  length,
                },
              },
            },
          });

          if (db && hasPersistentLock) {
            await db.collection(USER_LOCKS_COLLECTION).doc(uid).set({
              uid,
              jobId,
              createdAt: Date.now(),
              expiresAt: Date.now() + GENERATION_LOCK_TTL_MS,
            }, { merge: true });
          }
        } catch (e) {
          // Job creation failed → refund inline (we never told the user we'd
          // generate anything) and surface a 500.
          logEvent(`[GENERATE] createJob failed for uid=${uid}: ${e.message}`);
          activeRequests.delete(uid);
          if (db && hasPersistentLock && uid && jobId) {
            await releaseGenerationLock(uid, jobId, db);
          }
          await refundStory(uid, consumption.consumed, db).catch(refundErr =>
            logEvent(`[REFUND] inline refund after createJob fail: ${refundErr.message}`)
          );
          return res.status(500).json({ error: "Something went wrong. Please try again." });
        }

        // Respond immediately so the client connection can close. Phone can
        // sleep — the pipeline keeps running on the server. The polling
        // endpoint reads the durable job state.
        res.json({ jobId });
        logEvent(`[GENERATE] job=${jobId} created uid=${uid} consumed=${consumption.consumed || "none"}`);
        console.log({ uid, route: "/generate", jobId, status: "started", mode: incomingMode, normalizedMode, length });

        // Source of truth is now Firestore jobs for real users. We process
        // from persisted payload so restart recovery can resume in-flight work.
        if (db) {
          processFirestoreJob(jobId, db)
            .catch((err) => {
              logEvent(`[JOBS] process dispatch failed job=${jobId}: ${err.message}`);
            })
            .finally(() => {
              activeRequests.delete(uid);
            });
        } else {
          runStoryPipeline(storyInputs, { mode: normalizedMode, rawMode: incomingMode, cleanName, cleanDialect, cleanInterests, cleanIdea, cleanWish, cleanSeriesContext, cleanBeats, length })
            .then(async ({ story, title }) => {
              await resolveJob(jobId, story, title, db);
              logEvent(`[GENERATE] job=${jobId} done uid=${uid}`);
            })
            .catch(async (err) => {
              logEvent(`[GENERATE] job=${jobId} failed uid=${uid}: ${err.message}`);
              let refunded = false;
              try {
                await refundStory(uid, consumption.consumed, db);
                refunded = true;
                logEvent(`[REFUND] job=${jobId} uid=${uid} bucket=${consumption.consumed || "none"}`);
              } catch (refundErr) {
                logEvent(`[REFUND] job=${jobId} uid=${uid} FAILED: ${refundErr.message}`);
              }
              await failJob(jobId, "story_failed", db, { refunded });
            })
            .finally(() => {
              activeRequests.delete(uid);
            });
        }

      } catch (error) {
        logEvent(`Generate endpoint error: ${error.message}`);
        // If we made it past activeRequests.add but failed before the pipeline
        // started, the .finally above won't fire — clean up here.
        if (uid) activeRequests.delete(uid);
        if (db && hasPersistentLock && uid && jobId) {
          await releaseGenerationLock(uid, jobId, db);
        }
        res.status(500).json({ error: "Something went wrong. Please try again." });
      }
    }
  );

function getFirebaseAdminInstance() {
  if (!getApps().length) {
    const hasServiceAccount = FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY;
    const hasApplicationDefault = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (hasServiceAccount) {
      initializeAdminApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
    } else if (hasApplicationDefault) {
      initializeAdminApp({
        credential: applicationDefault(),
        projectId: FIREBASE_PROJECT_ID || undefined,
      });
    } else if (FIREBASE_PROJECT_ID) {
      initializeAdminApp({
        projectId: FIREBASE_PROJECT_ID,
      });
    } else {
      throw new Error("Firebase Admin configuration is missing.");
    }
  }

  return getAdminAuth();
}

async function requireAiAuth(req, res, next) {
  if (!REQUIRE_AUTH_FOR_AI_ROUTES) {
    req.authUser = null;
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Please log in to generate stories." });
  }

  try {
    const decodedToken = await getFirebaseAdminInstance().verifyIdToken(match[1]);
    req.authUser = decodedToken;
    return next();
  } catch (error) {
    logEvent(`Auth verification failed on ${req.path} from ${req.ip}: ${error.message}`);
    return res.status(401).json({ error: "Please log in to generate stories." });
  }
}

function buildAiLimiter({ windowMs, max, routeLabel }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator(req) {
      return req.authUser?.uid ? `uid:${req.authUser.uid}` : `ip:${ipKeyGenerator(req.ip)}`;
    },
    handler(req, res) {
      logEvent(`Rate limit hit on ${routeLabel} from ${req.ip}`);
      res.setHeader("Retry-After", "300");
      return res.status(429).json({
        error: "Too many story requests right now. Please wait a few minutes and try again.",
        retryAfter: 300,
      });
    },
  });
}

// =============================================================================
// Input safety
// =============================================================================

function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.replace(/[<>{}\[\]]/g, "").trim().substring(0, 200);
}

function containsSuspiciousContent(text) {
  const lower = text.toLowerCase();
  return /https?:\/\/|<script|javascript:|on\w+\s*=|eval\s*\(|import\s*\(/.test(lower);
}

// Child-safety word list — checked on every user-supplied input field and
// on every AI-generated story before it is sent to the client.
const CHILD_SAFETY_BANNED = [
  // profanity
  "fuck","shit","bitch","bastard","asshole","cunt","dick","cock","pussy","piss","crap",
  // sexual
  "sex","porn","nude","naked","boob","breast","penis","vagina","rape","molest","masturbat",
  // violence / weapons
  "kill","murder","gun","knife","stab","shoot","bomb","blood","gore","terror","suicide",
  // drugs / alcohol
  "drug","cocaine","heroin","meth","weed","alcohol","drunk","cigarette","vape",
  // horror / fear
  "demon","satan","devil","hell","horror","nightmare",
  // hate
  "racist","nigger","faggot","retard",
];

// Use whole-word matches to avoid false positives like "hello" matching "hell".
// Keep explicit stem support where needed (e.g. "masturbat...").
const SAFETY_PATTERN = new RegExp(
  CHILD_SAFETY_BANNED
    .map((w) => (w === "masturbat" ? `\\b${w}\\w*\\b` : `\\b${w}\\b`))
    .join("|"),
  "i"
);

function isUnsafeForChildren(text) {
  if (!text) return false;
  return SAFETY_PATTERN.test(text);
}

function getSafeFallbackStory(name) {
  return `${name} snuggled into bed as the stars twinkled softly above.\n\nTonight was a peaceful night filled with gentle dreams, kind thoughts, and a quiet sense of magic.\n\nAs the moon smiled down, ${name} drifted into a calm and happy sleep, ready for a new adventure tomorrow.`;
}

// Returns { min, max } word bounds for a given age string.
// These mirror getAgeWordTarget() in prompts.js but stay server-side
// so we don't import the ES module into the validator / enforcer.
function getAgeWordBounds(age) {
  const n = parseInt(age, 10);
  if (!isNaN(n) && n <= 4) return { min: 400, max: 650 };
  if (!isNaN(n) && n <= 7) return { min: 600, max: 950 };
  return { min: 1000, max: 1350 };
}

function enforceLength(text, age) {
  const words = text.split(" ");
  const { max } = getAgeWordBounds(age);
  if (words.length > max) {
    return words.slice(0, max).join(" ");
  }
  return text;
}

function cleanStory(text) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function polishStory(text) {
  return text
    .replace(/^\s*---+\s*$/gm, "") // strip markdown dividers that break story flow
    .replace(/[ \t]{2,}/g, " ")   // collapse multiple spaces/tabs (preserve newlines)
    .replace(/\n{3,}/g, "\n\n")   // collapse triple+ newlines to double
    .trim();
}

function validateStoryQuality(text, age) {
  if (!text) return false;

  const wordCount = text.split(" ").length;
  const wt = getAgeWordBounds(age);

  // Too short = weak or incomplete story
  if (wordCount < wt.min - 50) return false;

  // Too long = padding / runaway generation
  if (wordCount > wt.max + 50) return false;

  // Must contain paragraph structure
  if (!text.includes("\n")) return false;

  // Weak ending detection — check last 300 chars
  const lastPart = text.slice(-300).toLowerCase();
  const weakEndings = [
    "the end",
    "and then they went home",
    "it was all a dream",
  ];
  if (weakEndings.some(p => lastPart.includes(p))) return false;

  return true;
}

function isStoryOutputSafe(story) {
  if (!story) return false;
  return !SAFETY_PATTERN.test(story);
}

function finalizeStoryLocally(storyText, dialect, label) {
  const normalized = normalizeStoryOutput(storyText);

  try {
    return assertStoryQuality(normalized, { dialect, label });
  } catch (error) {
    logEvent(`${label} local quality warning: ${error.message}`);
    return normalized;
  }
}

async function runDeliveryQaPass(storyText, dialect) {
  let currentStory = normalizeStoryOutput(storyText);
  const deliveryBudget = getStoryTokenBudget(currentStory.split(/\s+/).length >= 950 ? "long" : "medium", "delivery", dialect);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const issues = detectStoryQualityIssues(currentStory, { dialect });
    if (!issues.length) {
      return currentStory;
    }

    const qaPrompt = buildDeliveryQaPrompt(currentStory, {
      issues,
      dialect,
    });

    currentStory = normalizeStoryOutput(
      await callClaudeWithRetry({
        system: DELIVERY_QA_SYSTEM_PROMPT,
        prompt: qaPrompt,
        maxTokens: deliveryBudget,
        temperature: 0.1,
        model: CLAUDE_MODEL_SONNET,
      })
    );
  }

  return assertStoryQuality(currentStory, {
    dialect,
    label: "Delivery QA output",
  });
}

// =============================================================================
// Claude API
// =============================================================================

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL_SONNET = "claude-sonnet-4-6";
const CLAUDE_MODEL_HAIKU  = "claude-haiku-4-5-20251001";
const CLAUDE_MODEL_DEFAULT = CLAUDE_MODEL_SONNET;
const API_VERSION = "2023-06-01";

// Tiered model selection:
//   All modes use Sonnet for full premium quality (7–10 min, 1000–1300 words)
//   short only uses Haiku (legacy, not surfaced in the main UI)
function getModelConfig({ mode, length } = {}) {
  if (mode === "hero") {
    return { model: CLAUDE_MODEL_SONNET, temperature: 0.85 };
  }
  switch (length) {
    case "short":
      return { model: CLAUDE_MODEL_HAIKU, temperature: 0.9 };
    case "medium":
    case "long":
    default:
      return { model: CLAUDE_MODEL_SONNET, temperature: 0.8 };
  }
}

async function callClaude({ system, prompt, maxTokens = 1200, temperature = 0.5, model, timeoutMs }) {
  if (!AI_ENABLED) {
    throw new Error("AI provider is not configured.");
  }

  // Scale timeout to token budget: long stories need 120s, short 60s
  const resolvedTimeout = timeoutMs || (maxTokens >= 4000 ? 120000 : maxTokens >= 2500 ? 90000 : 60000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolvedTimeout);

  try {
    // Build request body — system prompt is separate from messages
    const requestBody = {
      model: model || CLAUDE_MODEL_DEFAULT,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    };

    // Only include system parameter when provided
    if (system) {
      requestBody.system = system;
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (!data.content?.[0]?.text) {
      throw new Error("Empty response from Claude API");
    }

    return data.content[0].text;
  } finally {
    clearTimeout(timeout);
  }
}

async function callClaudeWithRetry(options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callClaude(options);
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      logEvent(`Claude API attempt ${attempt + 1} failed, retrying in ${delay}ms: ${error.message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Outer pipeline timeout — wraps any promise and rejects after ms with SERVER_TIMEOUT.
// This is separate from the per-call AbortController inside callClaude so we can
// cap the total pipeline time (all stages combined) independently of each call.
async function generateWithTimeout(promise, ms = 85000) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("SERVER_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

// =============================================================================
// Job Store — Firestore-backed for real users (durable across restarts),
// in-memory only for the anonymous dev path (no Firebase Admin available).
//
// Durable jobs are the source of truth: the server records the credit it
// consumed before the pipeline runs, so a crash mid-pipeline can be refunded
// by the sweeper instead of leaving the user paid-but-storyless.
// =============================================================================

const JOBS_COLLECTION = "jobs";
const JOB_STALE_MS = 10 * 60 * 1000;        // pipeline considered abandoned after this
const JOB_SWEEP_INTERVAL_MS = 2 * 60 * 1000; // how often the sweeper runs
const JOB_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // keep done/failed docs for 30 days for support
const JOB_LEASE_MS = 45 * 1000; // short lease so crashed workers recover quickly
const JOB_HEARTBEAT_MS = 15 * 1000;
const JOB_DISPATCH_INTERVAL_MS = 20 * 1000;
const GENERATION_LOCK_TTL_MS = 15 * 60 * 1000;
const USER_RATE_COLLECTION = "userRateLimits";
const USER_RATE_WINDOW_MS = 10 * 1000;
const USER_RATE_MAX_REQUESTS = 3;
const USER_LOCKS_COLLECTION = "generationLocks";
const INSTANCE_ID = crypto.randomUUID();

const jobStore = new Map(); // dev-anon only: jobId → { uid, status, story, title, error, createdAt }
const processingJobs = new Set();

async function createJob({ uid, db, consumed, ctx, jobId: providedJobId }) {
  const jobId = providedJobId || crypto.randomUUID();
  const base = {
    uid,
    status: "pending",
    consumed: consumed || null,
    createdAt: Date.now(),
    mode: ctx?.mode || null,
    rawMode: ctx?.rawMode || null,
    length: ctx?.length || null,
    childName: ctx?.cleanName || null,
    payload: ctx?.payload || null,
    refundedAt: null,
    completedAt: null,
    workerId: null,
    leaseUntil: null,
    lastHeartbeatAt: null,
  };
  if (db) {
    await db.collection(JOBS_COLLECTION).doc(jobId).set(base);
  } else {
    jobStore.set(jobId, base);
    setTimeout(() => jobStore.delete(jobId), JOB_STALE_MS);
  }
  return jobId;
}

async function resolveJob(jobId, story, title, db) {
  const update = { status: "done", story, title, completedAt: Date.now() };
  if (db) {
    try {
      await db.collection(JOBS_COLLECTION).doc(jobId).update(update);
    } catch (e) {
      logEvent(`resolveJob Firestore error for ${jobId}: ${e.message}`);
    }
  } else {
    const job = jobStore.get(jobId);
    if (job) jobStore.set(jobId, { ...job, ...update });
  }
}

async function enforcePersistentUserRateLimit(uid, db) {
  const now = Date.now();
  const rateRef = db.collection(USER_RATE_COLLECTION).doc(uid);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateRef);
      const data = snap.exists ? snap.data() : {};
      const windowStart = Number(data.windowStart || 0);
      const count = Number(data.count || 0);

      if (!windowStart || now - windowStart >= USER_RATE_WINDOW_MS) {
        tx.set(rateRef, {
          windowStart: now,
          count: 1,
          updatedAt: now,
          expiresAt: now + (2 * USER_RATE_WINDOW_MS),
        }, { merge: true });
        return { limited: false };
      }

      if (count >= USER_RATE_MAX_REQUESTS) {
        return { limited: true };
      }

      tx.set(rateRef, {
        windowStart,
        count: count + 1,
        updatedAt: now,
        expiresAt: now + (2 * USER_RATE_WINDOW_MS),
      }, { merge: true });
      return { limited: false };
    });
  } catch (e) {
    logEvent(`[RATE] persistent limiter failed for uid=${uid}: ${e.message}`);
    return { limited: false };
  }
}

async function acquireGenerationLock(uid, jobId, db) {
  const now = Date.now();
  const lockRef = db.collection(USER_LOCKS_COLLECTION).doc(uid);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (snap.exists) {
        const lock = snap.data();
        if ((lock.expiresAt || 0) > now) {
          return { ok: false, existingJobId: lock.jobId || null };
        }
      }

      tx.set(lockRef, {
        uid,
        jobId,
        createdAt: now,
        expiresAt: now + GENERATION_LOCK_TTL_MS,
      }, { merge: true });
      return { ok: true };
    });
  } catch (e) {
    logEvent(`[LOCK] acquire failed uid=${uid}: ${e.message}`);
    return { ok: false };
  }
}

async function refreshGenerationLock(uid, jobId, db) {
  const lockRef = db.collection(USER_LOCKS_COLLECTION).doc(uid);
  const now = Date.now();
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) return;
      const lock = snap.data();
      if (lock.jobId !== jobId) return;
      tx.update(lockRef, {
        expiresAt: now + GENERATION_LOCK_TTL_MS,
        updatedAt: now,
      });
    });
  } catch (e) {
    logEvent(`[LOCK] refresh failed uid=${uid} job=${jobId}: ${e.message}`);
  }
}

async function releaseGenerationLock(uid, jobId, db) {
  if (!uid || !db) return;
  const lockRef = db.collection(USER_LOCKS_COLLECTION).doc(uid);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) return;
      const lock = snap.data();
      if (lock.jobId !== jobId) return;
      tx.delete(lockRef);
    });
  } catch (e) {
    logEvent(`[LOCK] release failed uid=${uid} job=${jobId}: ${e.message}`);
  }
}

async function claimFirestoreJob(jobId, db) {
  const now = Date.now();
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(jobRef);
      if (!snap.exists) return { claimed: false, reason: "missing" };

      const data = snap.data();
      if (data.status === "done" || data.status === "failed") {
        return { claimed: false, reason: "terminal" };
      }

      const leaseUntil = Number(data.leaseUntil || 0);
      const heldByOther = data.status === "running"
        && leaseUntil > now
        && data.workerId
        && data.workerId !== INSTANCE_ID;

      if (heldByOther) {
        return { claimed: false, reason: "leased" };
      }

      tx.update(jobRef, {
        status: "running",
        workerId: INSTANCE_ID,
        leaseUntil: now + JOB_LEASE_MS,
        startedAt: data.startedAt || now,
        lastHeartbeatAt: now,
      });

      return {
        claimed: true,
        data: {
          ...data,
          status: "running",
          workerId: INSTANCE_ID,
          leaseUntil: now + JOB_LEASE_MS,
        },
      };
    });
  } catch (e) {
    logEvent(`[JOBS] claim failed for ${jobId}: ${e.message}`);
    return { claimed: false, reason: "error" };
  }
}

async function heartbeatFirestoreJob(jobId, db) {
  const now = Date.now();
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(jobRef);
      if (!snap.exists) return;
      const data = snap.data();
      if (data.status !== "running") return;
      if (data.workerId !== INSTANCE_ID) return;
      tx.update(jobRef, {
        leaseUntil: now + JOB_LEASE_MS,
        lastHeartbeatAt: now,
      });
    });
  } catch (e) {
    logEvent(`[JOBS] heartbeat failed for ${jobId}: ${e.message}`);
  }
}

async function processFirestoreJob(jobId, db) {
  if (!jobId || !db || processingJobs.has(jobId)) return;
  processingJobs.add(jobId);

  let heartbeat = null;
  let claimed = null;
  let uid = null;
  let consumed = null;

  try {
    claimed = await claimFirestoreJob(jobId, db);
    if (!claimed?.claimed) return;

    const data = claimed.data || {};
    uid = data.uid || null;
    consumed = data.consumed || null;
    const payload = data.payload || null;

    if (!payload?.storyInputs || !payload?.pipeline) {
      throw new Error("job payload missing");
    }

    heartbeat = setInterval(() => {
      heartbeatFirestoreJob(jobId, db).catch((e) => {
        logEvent(`[JOBS] heartbeat timer error for ${jobId}: ${e.message}`);
      });
      if (uid) {
        refreshGenerationLock(uid, jobId, db).catch((e) => {
          logEvent(`[LOCK] refresh timer error uid=${uid} job=${jobId}: ${e.message}`);
        });
      }
    }, JOB_HEARTBEAT_MS);

    logEvent(`[JOBS] processing job=${jobId} uid=${uid || "unknown"}`);
    const { story, title } = await runStoryPipeline(payload.storyInputs, payload.pipeline);
    await resolveJob(jobId, story, title, db);
    logEvent(`[JOBS] done job=${jobId} uid=${uid || "unknown"}`);
  } catch (err) {
    logEvent(`[JOBS] failed job=${jobId}: ${err.message}`);
    let refunded = false;
    if (uid && consumed) {
      try {
        await refundStory(uid, consumed, db);
        refunded = true;
        logEvent(`[REFUND] job=${jobId} uid=${uid} bucket=${consumed}`);
      } catch (refundErr) {
        logEvent(`[REFUND] job=${jobId} uid=${uid} FAILED: ${refundErr.message}`);
      }
    }
    await failJob(jobId, "story_failed", db, { refunded });
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    if (uid) {
      await releaseGenerationLock(uid, jobId, db);
    }
    processingJobs.delete(jobId);
  }
}

async function dispatchPendingJobs() {
  if (!hasFirebaseAdminConfigured()) return;
  let db;
  try { db = getFirestoreDb(); } catch { return; }

  try {
    const snap = await db.collection(JOBS_COLLECTION)
      .where("status", "in", ["pending", "running"])
      .limit(20)
      .get();

    for (const doc of snap.docs) {
      processFirestoreJob(doc.id, db).catch((e) => {
        logEvent(`[JOBS] dispatch error for ${doc.id}: ${e.message}`);
      });
    }
  } catch (e) {
    logEvent(`[JOBS] dispatch query error: ${e.message}`);
  }
}

async function failJob(jobId, errorMsg, db, { refunded = false } = {}) {
  const update = {
    status: "failed",
    error: errorMsg || null,
    completedAt: Date.now(),
  };
  if (refunded) update.refundedAt = Date.now();
  if (db) {
    try {
      await db.collection(JOBS_COLLECTION).doc(jobId).update(update);
    } catch (e) {
      logEvent(`failJob Firestore error for ${jobId}: ${e.message}`);
    }
  } else {
    const job = jobStore.get(jobId);
    if (job) jobStore.set(jobId, { ...job, ...update });
  }
}

// Read a job for the polling endpoint. Verifies the requesting uid owns the
// job (anyone querying someone else's jobId gets `forbidden`, never the data).
async function loadJob(jobId, requestingUid) {
  // In-memory first (cheap; covers dev-anon and freshly-created jobs).
  const mem = jobStore.get(jobId);
  if (mem) {
    if (mem.uid && requestingUid && mem.uid !== requestingUid) {
      return { status: "forbidden" };
    }
    return mem;
  }
  // Firestore lookup for real users.
  if (!hasFirebaseAdminConfigured()) return { status: "expired" };
  try {
    const db = getFirestoreDb();
    const snap = await db.collection(JOBS_COLLECTION).doc(jobId).get();
    if (!snap.exists) return { status: "expired" };
    const data = snap.data();
    if (requestingUid && data.uid && data.uid !== requestingUid) {
      return { status: "forbidden" };
    }
    return {
      status: data.status,
      story: data.story || null,
      title: data.title || null,
      error: data.error || null,
    };
  } catch (e) {
    logEvent(`loadJob error for ${jobId}: ${e.message}`);
    return { status: "expired" };
  }
}

function hasFirebaseAdminConfigured() {
  return !!(
    (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    FIREBASE_PROJECT_ID
  );
}

// Sweeper — finds pending jobs older than JOB_STALE_MS and refunds them.
// Runs both on startup and on a setInterval. Uses a Firestore transaction
// to be safe across multiple server instances: only one sweeper per job
// will flip status from pending → failed and trigger the refund.
async function sweepStalePendingJobs() {
  if (!hasFirebaseAdminConfigured()) return;
  let db;
  try { db = getFirestoreDb(); } catch { return; }

  const cutoff = Date.now() - JOB_STALE_MS;
  const now = Date.now();
  let stale;
  try {
    stale = await db.collection(JOBS_COLLECTION)
      .where("status", "in", ["pending", "running"])
      .where("createdAt", "<", cutoff)
      .limit(20)
      .get();
  } catch (e) {
    // Most likely a missing composite index on (status, createdAt).
    // Logged once per sweep so the operator notices and creates the index.
    logEvent(`Sweeper query error (likely missing Firestore index status+createdAt): ${e.message}`);
    return;
  }

  for (const doc of stale.docs) {
    const data = doc.data();
    let didRefund = false;
    try {
      didRefund = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        if (!fresh.exists) return false;
        const d = fresh.data();
        if (d.status !== "pending" && d.status !== "running") return false;
        if (d.status === "running" && Number(d.leaseUntil || 0) > now) return false;
        if (d.refundedAt) return false;
        tx.update(doc.ref, {
          status: "failed",
          error: "abandoned_by_server",
          completedAt: Date.now(),
          refundedAt: Date.now(),
        });
        return true;
      });
    } catch (e) {
      logEvent(`Sweeper transaction error for ${doc.id}: ${e.message}`);
      continue;
    }
    if (didRefund && data.consumed) {
      try {
        await refundStory(data.uid, data.consumed, db);
        await releaseGenerationLock(data.uid, doc.id, db);
        logEvent(`[SWEEPER] Refunded abandoned job ${doc.id} for uid=${data.uid} bucket=${data.consumed}`);
      } catch (e) {
        logEvent(`[SWEEPER] Refund failed for ${doc.id}: ${e.message}`);
      }
    } else if (didRefund) {
      await releaseGenerationLock(data.uid, doc.id, db);
      logEvent(`[SWEEPER] Marked job ${doc.id} failed (no credit consumed; nothing to refund)`);
    }
  }
}

// Retry wrapper: calls callClaudeWithRetry up to (retries+1) times, validates each
// result, and falls back to a safe story if all attempts fail or time out.
async function generateStorySafe(options, name, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const story = await generateWithTimeout(callClaudeWithRetry(options), 85000);
      if (isStoryValid(story)) return story;
    } catch (e) {
      logEvent(`generateStorySafe retry ${i}: ${e.message}`);
    }
  }
  return getSafeFallbackStory(name);
}

function isAiProviderUnavailableError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("not configured") ||
    message.includes("credit balance is too low") ||
    message.includes("rate limit") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded") ||
    message.includes("service unavailable") ||
    message.includes("timed out") ||
    message.includes("aborterror")
  );
}

// =============================================================================
// Express app
// =============================================================================


app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// HTTPS redirect — must be first in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, "https://" + req.headers.host + req.url);
    }
    next();
  });
}

// Security headers — before static files so everything gets them
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com"],
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://*.firebaseapp.com",
          "https://*.firebasestorage.app",
          "https://www.gstatic.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://firestore.googleapis.com",
          "https://firebaseinstallations.googleapis.com",
        ],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://*.firebaseauth.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
  })
);

// Request size limit
app.use(express.json({ limit: "10kb" }));
app.use(compression());

// CORS — scoped to API routes only.
// Applying CORS globally blocks same-origin static assets (app.js, CSS, fonts)
// with HTTP 500 when the request's Origin header isn't in ALLOWED_ORIGINS,
// because Express's default error handler converts the thrown CORS error to 500.
// Static file requests are same-origin and don't need CORS at all; only the
// JSON API routes below need to opt in.
// Duplicate corsMiddleware declaration removed. The global definition at the top is used.

// Duplicate generateLimiter declaration removed. The definition at the top is used.

const polishLimiter = buildAiLimiter({
  windowMs: POLISH_LIMIT_WINDOW_MS,
  max: POLISH_LIMIT_MAX,
  routeLabel: "/polish",
});

// Request logging
app.use((req, res, next) => {
  logEvent(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

// =============================
// PRODUCTION CACHING HEADERS
// =============================
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|jpeg|webp|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }
  next();
});

// Static files — after security middleware
app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiEnabled: AI_ENABLED,
  });
});

// =============================================================================
// Polish endpoint — runs a pre-generated story through the editor pass only
// Used as fallback when procedural stories need AI polish
// =============================================================================

app.options("/polish", corsMiddleware);
app.post(
  "/polish",
  corsMiddleware,
  requireAiAuth,
  polishLimiter,
  [
    body("story").isString().isLength({ min: 10, max: 5000 }).trim(),
    body("dialect").optional().custom(isSupportedStoryLocale),
    body("mode").optional().isIn(["edit", "rewrite"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid story text." });
      }

      const { story, dialect, mode } = req.body;
      const cleanDialect = resolveLanguageCode(dialect);
      const polishMode = mode === "rewrite" ? "rewrite" : "edit";

      logEvent(`Polish endpoint: ${polishMode} pass on procedural story`);

      // Rewrite mode = aggressive Disney-grade rewrite of a rough procedural
      // draft. Edit mode = conservative grammar/flow pass on an AI story.
      const polishSystem = EDITOR_SYSTEM_PROMPT;
      // In rewrite mode we frame the draft as a story brief so Sonnet
      // treats it as a spec to discard rather than text worth preserving.
      const polishPrompt = polishMode === "rewrite"
        ? `STORY BRIEF (ignore the prose, use only the facts below):\n\n${story}\n\nNow write a completely new bedtime story using only the character name, companion, setting, and goal from the brief above. Do not keep any sentences from the brief.`
        : buildGrammarPrompt(story, cleanDialect);
      const polishTemperature = polishMode === "rewrite" ? 1.0 : 0.2;
      const polishMaxTokens = polishMode === "rewrite" ? 2000 : 1200;

      const polished = await callClaudeWithRetry({
        system: polishSystem,
        prompt: polishPrompt,
        maxTokens: polishMaxTokens,
        temperature: polishTemperature,
        model: CLAUDE_MODEL_SONNET,
      });

      const finalStory = USE_FULL_AI_PIPELINE
        ? await runDeliveryQaPass(polished, cleanDialect)
        : finalizeStoryLocally(polished, cleanDialect, "Polish endpoint output");

      logEvent("Polish endpoint: complete");
      res.json({ story: finalStory });
    } catch (error) {
      if (isAiProviderUnavailableError(error)) {
        logEvent(`Polish endpoint: AI unavailable, returning original story unchanged. Reason: ${error.message}`);
        return res.json({ story: req.body?.story || "" });
      }

      logEvent(`Polish endpoint error: ${error.message}`);
      return res.status(422).json({ error: "Story could not be polished to quality standard." });
    }
  }
);

// =============================================================================
// Story generation endpoint
// =============================================================================

// =============================================================================
// Teddy top-up / credit status endpoint
// =============================================================================
app.options("/api/teddy-topup", corsMiddleware);
app.get("/api/teddy-topup", corsMiddleware, requireAiAuth, async (req, res) => {
  const uid = req.authUser?.uid;
  const email = req.authUser?.email || "";
  const isDevAccount = DEVELOPER_EMAILS.has(email);
  // Anonymous local dev (REQUIRE_AUTH_FOR_AI_ROUTES=false) — no Firestore lookup.
  // Treat as premium so the local UI works, but never apply this branch in prod
  // (preflightCheck refuses to boot in prod when REQUIRE_AUTH_FOR_AI_ROUTES=false).
  if (!uid) return res.json({ teddies_remaining: 999, teddies_last_reset: null, is_premium: true });

  try {
    const db = getFirestoreDb();
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const remaining = getTotalCredits(userData);
    // Premium = active subscription OR an explicitly listed developer account.
    // We deliberately do NOT trust NODE_ENV here — that bypass would let any
    // signed-in user against a dev server appear premium client-side.
    const isPremium = !!(userData.isSubscribed || userData.isPremium || isDevAccount);
    return res.json({
      teddies_remaining: remaining,
      teddies_last_reset: userData.subscriptionStartDate || null,
      is_premium: isPremium,
    });
  } catch (e) {
    logEvent(`teddy-topup error: ${e.message}`);
    return res.json({ teddies_remaining: null, teddies_last_reset: null, is_premium: isDevAccount });
  }
});

// =============================================================================
// Stripe — checkout + webhook
// =============================================================================

app.options("/api/checkout", corsMiddleware);
app.post("/api/checkout", corsMiddleware, express.json({ limit: "4kb" }), (req, res, next) => {
  const type = req.body?.type;
  // One-off 99p checkout can be started as a guest (no signup/login).
  if (type === "oneoff") {
    return createCheckoutSession(req, res);
  }
  return requireAiAuth(req, res, () => createCheckoutSession(req, res));
});

app.options("/api/guest/generate-oneoff", corsMiddleware);
app.post(
  "/api/guest/generate-oneoff",
  corsMiddleware,
  express.json({ limit: "8kb" }),
  generateLimiter,
  [
    body("checkoutSessionId").isString().isLength({ min: 10, max: 200 }).trim(),
    body("name").isString().isLength({ min: 1, max: 50 }).trim(),
    body("gender").optional().isIn(["boy", "girl", "neutral"]),
    body("language").optional().isString().isLength({ max: 10 }).trim(),
    body("dialect").optional().custom(isSupportedStoryLocale),
  ],
  async (req, res) => {
    try {
      if (!AI_ENABLED) {
        return res.status(503).json({
          error: "Story generation is temporarily unavailable. Please try again shortly.",
          reason: "ai_unconfigured",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Please provide valid child details." });
      }

      const checkoutSessionId = String(req.body?.checkoutSessionId || "").trim();
      const purchase = await validateAndConsumeGuestOneoff(checkoutSessionId);
      if (!purchase.ok) {
        return res.status(purchase.status || 400).json({ error: purchase.error || "Purchase validation failed." });
      }

      const cleanName = sanitizeInput(req.body?.name || "").slice(0, 50) || "Little Star";
      const cleanGender = ["boy", "girl", "neutral"].includes(req.body?.gender) ? req.body.gender : "neutral";
      const cleanDialect = resolveLanguageCode(req.body?.dialect || req.body?.language || "en-GB");
      const cleanInterests =
        cleanGender === "boy"
          ? "adventure, friendship, stars, kindness"
          : cleanGender === "girl"
            ? "magic, friendship, stars, kindness"
            : "imagination, friendship, stars, kindness";

      const storyInputs = {
        name: cleanName,
        age: "5",
        interests: cleanInterests,
        length: "medium",
        mode: "medium-surprise",
        storyType: "quick",
        language: cleanDialect,
        dialect: cleanDialect,
        customIdea: "",
        therapeuticSituation: "",
        seriesContext: "",
        childWish: "",
        dayBeats: "",
        dayMood: "",
        globalInspiration: undefined,
        appearance: undefined,
        personalWorld: undefined,
        gender: cleanGender,
        siblings: undefined,
        family: undefined,
        cultural_world: undefined,
        recurring_character: undefined,
        last_story_summary: undefined,
      };

      const { story, title } = await runStoryPipeline(storyInputs, {
        mode: "random",
        rawMode: "medium-surprise",
        cleanName,
        cleanDialect,
        cleanInterests,
        cleanIdea: "",
        cleanWish: "",
        cleanSeriesContext: "",
        cleanBeats: "",
        length: "medium",
        useFullPipeline: false,
        maxAttempts: 1,
      });

      return res.json({ story, title: title || `${cleanName}'s Bedtime Story` });
    } catch (error) {
      logEvent(`Guest one-off generation error: ${error.message}`);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  }
);

// Webhook must use raw body — register BEFORE any global json middleware
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  handleWebhook(req, res);
});

// =============================================================================
// Analytics — fire-and-forget event logging
// =============================================================================

app.options("/track", corsMiddleware);
app.post("/track", corsMiddleware, express.json({ limit: "4kb" }), (req, res) => {
  const { event, data } = req.body || {};
  if (!event || typeof event !== "string") return res.json({ ok: false });
  const safe = event.replace(/[^a-z0-9_]/gi, "").slice(0, 64);
  console.log(`[TRACK] ${safe}`, JSON.stringify(data || {}).slice(0, 200));
  res.json({ ok: true });
});

app.options("/generate", corsMiddleware);

// Valid raw modes for story identity — anything outside this set falls back to "adventure"
const VALID_STORY_MODES = ["sleepy", "adventure", "therapeutic", "hero", "custom", "create", "today", "random", "medium-surprise", "long-surprise"];

async function runStoryPipeline(storyInputs, { mode, rawMode, cleanName, cleanDialect, cleanInterests, cleanIdea, cleanWish, cleanSeriesContext, cleanBeats, length, useFullPipeline, maxAttempts }) {
  const runFullPipeline = typeof useFullPipeline === "boolean" ? useFullPipeline : USE_FULL_AI_PIPELINE;
  const maxTries = Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : 2;
  const safeRawMode = rawMode && VALID_STORY_MODES.includes(rawMode) ? rawMode : "adventure";
  if (!rawMode || !VALID_STORY_MODES.includes(rawMode)) {
    logEvent(`[WARN] Invalid story mode received: "${rawMode}" — falling back to "adventure"`);
  }
  const modelConfig = getModelConfig({ mode, length });
  logEvent(`Model config for "${cleanName}": ${modelConfig.model} @ temp ${modelConfig.temperature}`);

  const storyMaxTokens = getStoryTokenBudget(length, "story", storyInputs.language);
  const editorMaxTokens = getStoryTokenBudget(length, "editor", storyInputs.language);
  const validatorMaxTokens = getStoryTokenBudget(length, "validator", storyInputs.language);
  const titleMaxTokens = getStoryTokenBudget(length, "title", storyInputs.language);

  let finalStory = null;
  let cleanTitle = null;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    if (attempt > 1) logEvent(`Regeneration triggered for "${cleanName}" (attempt ${attempt})`);

    const storyPrompt = buildStoryPrompt({
      ...storyInputs,
      mode: safeRawMode,
      customIdea: cleanIdea,
      childWish: cleanWish,
      dayBeats: cleanBeats,
    });
    const rawStory = await callClaudeWithRetry({
      system: STORY_SYSTEM_PROMPT, prompt: storyPrompt,
      maxTokens: storyMaxTokens, temperature: modelConfig.temperature, model: modelConfig.model,
    });
    logEvent(`Stage 1 complete (generate) for "${cleanName}" [attempt ${attempt}]`);

    const grammarPrompt = buildGrammarPrompt(rawStory, cleanDialect);
    const editedStory = await callClaudeWithRetry({
      system: EDITOR_SYSTEM_PROMPT, prompt: grammarPrompt,
      maxTokens: editorMaxTokens, temperature: 0.2, model: modelConfig.model,
    });

    if (!runFullPipeline) {
      logEvent(`Stage 2 complete (edit) for "${cleanName}" [lean pipeline, attempt ${attempt}]`);
      const candidate = finalizeStoryLocally(editedStory, cleanDialect, `Final story for ${cleanName}`);
      if (validateStoryQuality(candidate, storyInputs.age) || maxTries === 1) {
        finalStory = candidate;
        cleanTitle = `${cleanName}'s Bedtime Story`;
        break;
      }
      logEvent(`Quality check failed for "${cleanName}" [attempt ${attempt}] — retrying`);
      continue;
    }

    const titlePrompt = buildTitlePrompt(rawStory, cleanName, cleanDialect);
    const title = await callClaudeWithRetry({
      prompt: titlePrompt, maxTokens: titleMaxTokens, temperature: 0.4, model: modelConfig.model,
    });
    logEvent(`Stage 2 complete (edit + title) for "${cleanName}" [attempt ${attempt}]`);

    const validationPrompt = buildValidationPrompt(editedStory, {
      mode, dialect: cleanDialect, interests: cleanInterests, customIdea: cleanIdea,
      childWish: cleanWish, seriesContext: cleanSeriesContext, dayBeats: cleanBeats,
    });
    const validatorOutput = await callClaudeWithRetry({
      system: VALIDATOR_SYSTEM_PROMPT, prompt: validationPrompt,
      maxTokens: validatorMaxTokens, temperature: 0.1, model: modelConfig.model,
    });
    logEvent(`Stage 3 complete (validate) for "${cleanName}" [attempt ${attempt}]`);

    if (validatorOutput.trim() === "REGENERATE") {
      logEvent(`Validator triggered REGENERATE for "${cleanName}" [attempt ${attempt}]`);
      continue;
    }
    const validatorIssues = detectStoryQualityIssues(validatorOutput, { dialect: cleanDialect });
    if (validatorIssues.length) {
      logEvent(`Validator issues for "${cleanName}" [attempt ${attempt}]: ${validatorIssues.join(" | ")}`);
      continue;
    }

    finalStory = validatorOutput;
    cleanTitle = title.replace(/["']/g, "").trim();
    break;
  }

  if (!finalStory) {
    logEvent(`Pipeline exhausted for "${cleanName}" — serving safe fallback story`);
    finalStory = getSafeFallbackStory(cleanName);
    cleanTitle = `${cleanName}'s Bedtime Story`;
  }

  finalStory = runFullPipeline
    ? await runDeliveryQaPass(finalStory, cleanDialect)
    : finalizeStoryLocally(finalStory, cleanDialect, `Final story for ${cleanName}`);

  if (runFullPipeline) {
    finalStory = assertStoryQuality(finalStory, { dialect: cleanDialect, label: `Final story for ${cleanName}` });
  }

  // Enforce word limit and polish whitespace
  finalStory = enforceLength(finalStory, storyInputs.age);
  finalStory = polishStory(finalStory);

  if (!cleanTitle) cleanTitle = `${cleanName}'s Bedtime Story`;

  if (!isStoryOutputSafe(finalStory)) {
    logEvent(`UNSAFE output detected for "${cleanName}" — using safe fallback`);
    finalStory = getSafeFallbackStory(cleanName);
    cleanTitle = `${cleanName}'s Peaceful Night`;
  }

  logEvent(`Pipeline complete for "${cleanName}": "${cleanTitle}"`);
  return { story: finalStory, title: cleanTitle };
}

// =============================================================================
// Job polling endpoint — client calls this after phone wakes to collect result
// =============================================================================

app.options("/api/job/:jobId", corsMiddleware);
app.get("/api/job/:jobId", corsMiddleware, requireAiAuth, async (req, res) => {
  const { jobId } = req.params;
  if (!/^[0-9a-f-]{36}$/.test(jobId)) return res.status(400).json({ status: "invalid" });
  // requestingUid is null in pure-anon dev (REQUIRE_AUTH_FOR_AI_ROUTES=false).
  // loadJob enforces uid match when both are present, so a real user can
  // never read another user's job — they get { status: "forbidden" }.
  const requestingUid = req.authUser?.uid || null;
  const job = await loadJob(jobId, requestingUid);
  if (job.status === "forbidden") return res.status(403).json({ status: "forbidden" });
  res.json(job);
});

// =============================
// SERVER START (PRODUCTION SAFE + AUTO PORT)
// =============================

// Pre-flight: refuse to boot in production without the things that would
// silently break the product — Claude key, Firebase Admin credentials,
// allowed origins, and (if Stripe is wired) the webhook secret. Each of
// these has a "looks fine, fails for users" mode that's worse than crashing.
function preflightCheck() {
  const isProd = process.env.NODE_ENV === "production";
  const fatal = [];
  const warn = [];

  // Claude key — required everywhere; in dev we warn instead of exit so the
  // rest of the app still boots for UI work.
  if (!AI_ENABLED) {
    const reason = !API_KEY
      ? "ANTHROPIC_API_KEY (or CLAUDE_API_KEY) is missing from the environment"
      : "ANTHROPIC_API_KEY does not look like a valid Claude key (expected sk-ant-…)";
    (isProd ? fatal : warn).push(`AI: ${reason}`);
  }

  // Firebase Admin — needed for token verification and credit accounting.
  // Production must have one of: full service-account triple, GOOGLE_APPLICATION_CREDENTIALS,
  // or at minimum FIREBASE_PROJECT_ID. Without any of these, /generate cannot
  // verify tokens and consumeStory cannot read user docs.
  const hasFirebaseAdmin =
    (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) ||
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !!FIREBASE_PROJECT_ID;
  if (isProd && !hasFirebaseAdmin) {
    fatal.push("Firebase Admin: set FIREBASE_PROJECT_ID (+ FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY) or GOOGLE_APPLICATION_CREDENTIALS");
  }

  // CORS — production must restrict origins. Wide-open CORS lets any site
  // burn your Claude credits using a victim's stored Firebase token.
  if (isProd && ALLOWED_ORIGINS.length === 0) {
    fatal.push("CORS: ALLOWED_ORIGINS is empty — production must list explicit HTTPS origins");
  }

  // Stripe webhook — if Stripe secret is set we MUST also have the webhook
  // signing secret, otherwise anyone can POST a forged checkout.session.completed
  // and grant themselves credits.
  if (process.env.STRIPE_SECRET && !process.env.STRIPE_WEBHOOK_SECRET) {
    (isProd ? fatal : warn).push("Stripe: STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET is set");
  } else if (!process.env.STRIPE_SECRET) {
    warn.push("Stripe: STRIPE_SECRET not set — payments disabled");
  }

  // Auth — production must require authenticated requests on AI routes.
  if (isProd && !REQUIRE_AUTH_FOR_AI_ROUTES) {
    fatal.push("Auth: REQUIRE_AUTH_FOR_AI_ROUTES is false in production — every request would be treated as anonymous dev");
  }

  if (warn.length) {
    for (const w of warn) console.warn(`⚠️  ${w}`);
  }
  if (fatal.length) {
    for (const f of fatal) console.error(`❌ FATAL: ${f}`);
    console.error(`\nRefusing to start. Fix the items above and redeploy.\n`);
    process.exit(1);
  }

  if (AI_ENABLED) {
    console.log(`✅ AI configured (key ends …${API_KEY.slice(-6)}, pipeline=${USE_FULL_AI_PIPELINE ? "full" : "lean"})`);
  }
  console.log(`✅ CORS origins: ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(", ") : "(open — dev only)"}`);
}

preflightCheck();

// Refund sweeper: catch jobs whose pipeline never finished (server crash,
// OOM, deploy mid-flight) and return the credit to the user. Runs once on
// boot, then on a 2-minute interval. Multi-instance safe via Firestore tx.
dispatchPendingJobs().catch(e => logEvent(`Initial job dispatch error: ${e.message}`));
setInterval(() => {
  dispatchPendingJobs().catch(e => logEvent(`Job dispatch error: ${e.message}`));
}, JOB_DISPATCH_INTERVAL_MS);

sweepStalePendingJobs().catch(e => logEvent(`Initial sweeper run error: ${e.message}`));
setInterval(() => {
  sweepStalePendingJobs().catch(e => logEvent(`Sweeper run error: ${e.message}`));
}, JOB_SWEEP_INTERVAL_MS);

const DEFAULT_PORT = 3000;

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

function startServer(port) {
  const normalizedPort = normalizePort(port);

  const server = app.listen(normalizedPort, () => {
    console.log(`✅ Server running on http://localhost:${normalizedPort}`);
  });

  server.on("error", (error) => {
    if (error.syscall !== "listen") throw error;

    if (error.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${normalizedPort} busy, trying ${normalizedPort + 1}...`);
      startServer(normalizedPort + 1);
    } else if (error.code === "EACCES") {
      console.error(`❌ Port ${normalizedPort} requires elevated privileges.`);
      process.exit(1);
    } else {
      throw error;
    }
  });
}

// Start server
startServer(process.env.PORT || DEFAULT_PORT);
