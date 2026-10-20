"use strict";

/**
 * Workstation 3D Executive Office API & Static Frontend Proxy Lambda
 * Zero external dependencies — uses Node 22 built-in @aws-sdk/client-dynamodb & @aws-sdk/client-s3.
 *
 * Routes:
 *   GET  /office   -> Retrieve current OfficeState from DynamoDB
 *   POST /office   -> Apply actions to OfficeState in DynamoDB
 *   GET  /*        -> Serve static Next.js 3D frontend assets from S3 (HTTPS via API Gateway)
 */

const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "af-south-1";
const ddb = new DynamoDBClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

const OFFICE_TABLE = process.env.OFFICE_TABLE || "workstation_office_state";
const FRONTEND_BUCKET =
  process.env.FRONTEND_BUCKET || "workstation-3d-office-frontend-628711466156";
const STATE_KEY = "main_office";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const BINARY_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
]);

const INITIAL_OFFICE_STATE = {
  officeName: "Kayfarm Executive 3D Workstation HQ",
  ownerName: "William Pepple",
  dailyMotto: "Ship high-impact architecture with deep focus & clarity.",
  todos: [
    {
      id: "todo-1",
      title: "Review cloud infrastructure & Terraform DynamoDB state",
      category: "Engineering",
      priority: "critical",
      completed: false,
      estimatedMinutes: 45,
      createdAt: "2026-10-20T08:30:00.000Z",
    },
    {
      id: "todo-2",
      title: "Walk into the 3D Executive Office & prioritize today’s board",
      category: "Deep Work",
      priority: "high",
      completed: true,
      estimatedMinutes: 15,
      createdAt: "2026-10-20T09:00:00.000Z",
      completedAt: "2026-10-20T09:15:00.000Z",
    },
    {
      id: "todo-3",
      title: "Complete 90-minute Deep Work sprint on core API endpoints",
      category: "Engineering",
      priority: "critical",
      completed: false,
      estimatedMinutes: 90,
      createdAt: "2026-10-20T09:30:00.000Z",
    },
    {
      id: "todo-4",
      title: "Audit production CloudFront & API Gateway latency metrics",
      category: "Engineering",
      priority: "high",
      completed: false,
      estimatedMinutes: 30,
      createdAt: "2026-10-20T10:00:00.000Z",
    },
    {
      id: "todo-5",
      title: "Sync product roadmap & Q4 milestones on the Activity Board",
      category: "Admin",
      priority: "medium",
      completed: false,
      estimatedMinutes: 40,
      createdAt: "2026-10-20T11:00:00.000Z",
    },
    {
      id: "todo-6",
      title: "Evening wrap-up: clear inbox & prep tomorrow’s TV checklist",
      category: "Personal",
      priority: "low",
      completed: false,
      estimatedMinutes: 20,
      createdAt: "2026-10-20T12:00:00.000Z",
    },
  ],
  activities: [
    {
      id: "act-1",
      title: "Morning Standup & Architecture Triage",
      description:
        "Review system health, check AWS alerts, and align top 3 deliverables for the day.",
      timeSlot: "09:00 - 09:45",
      durationMinutes: 45,
      stage: "completed",
      colorTag: "#10b981",
      linkedTodoId: "todo-2",
      completedAt: "2026-10-20T09:45:00.000Z",
    },
    {
      id: "act-2",
      title: "Deep Work Block #1: Full-Stack Feature Build",
      description:
        "Zero-distraction coding block at the Executive Desk with Pomodoro timer active.",
      timeSlot: "10:00 - 11:30",
      durationMinutes: 90,
      stage: "active",
      colorTag: "#38bdf8",
      linkedTodoId: "todo-3",
      startedAt: "2026-10-20T10:00:00.000Z",
    },
    {
      id: "act-3",
      title: "AWS Terraform & DynamoDB Production Deployment",
      description:
        "Provision serverless backend, verify DynamoDB persistence, and push static build to S3.",
      timeSlot: "12:00 - 13:00",
      durationMinutes: 60,
      stage: "planned",
      colorTag: "#f59e0b",
      linkedTodoId: "todo-1",
    },
    {
      id: "act-4",
      title: "Strategy & Product Review in Focus Lounge",
      description:
        "Step over to the West Focus Lounge for coffee and system design notes.",
      timeSlot: "14:30 - 15:30",
      durationMinutes: 60,
      stage: "planned",
      colorTag: "#a855f7",
      linkedTodoId: "todo-5",
    },
    {
      id: "act-5",
      title: "End-of-Day Retrospective & TV Board Reset",
      description:
        "Check off completed items on the Office TV and log key takeaways in the desk scratchpad.",
      timeSlot: "17:00 - 17:30",
      durationMinutes: 30,
      stage: "planned",
      colorTag: "#ec4899",
      linkedTodoId: "todo-6",
    },
  ],
  stickyNotes: [
    {
      id: "note-1",
      text: "Rule #1: Ship the hardest task on the Office TV before noon!",
      color: "#fef08a",
      author: "William",
      createdAt: "2026-10-20T08:00:00.000Z",
    },
    {
      id: "note-2",
      text: "Press [E] near the Whiteboard or TV to open full interactive workspace controls.",
      color: "#bae6fd",
      author: "System",
      createdAt: "2026-10-20T08:15:00.000Z",
    },
    {
      id: "note-3",
      text: "DynamoDB syncs both your TV To-Do list and your Activity Board automatically.",
      color: "#bbf7d0",
      author: "Cloud Ops",
      createdAt: "2026-10-20T08:30:00.000Z",
    },
  ],
  scratchpadText:
    "=== EXECUTIVE DESK SCRATCHPAD ===\nDate: Tuesday, Oct 20, 2026\n\nKey Objectives Today:\n1. Complete all Critical & High priority items on the Office Smart TV.\n2. Run 25m / 50m Pomodoro focus blocks directly from the Activity Board or Desk.\n3. Keep AWS production infrastructure clean, fast, and reproducible via Terraform.",
  quickLinks: [
    {
      id: "link-1",
      label: "AWS Console",
      url: "https://console.aws.amazon.com/",
      category: "Cloud",
    },
    {
      id: "link-2",
      label: "GitHub Repositories",
      url: "https://github.com/",
      category: "Code",
    },
    {
      id: "link-3",
      label: "Terraform Registry",
      url: "https://registry.terraform.io/",
      category: "Infra",
    },
    {
      id: "link-4",
      label: "Google Calendar",
      url: "https://calendar.google.com/",
      category: "Schedule",
    },
  ],
  focusSession: {
    activeActivityId: "act-2",
    activeActivityTitle: "Deep Work Block #1: Full-Stack Feature Build",
    durationSeconds: 1500,
    remainingSeconds: 1500,
    isRunning: false,
    mode: "pomodoro",
    completedSessionsToday: 2,
  },
  updatedAt: new Date().toISOString(),
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(payload),
});

async function loadState() {
  try {
    const res = await ddb.send(
      new GetItemCommand({
        TableName: OFFICE_TABLE,
        Key: { id: { S: STATE_KEY } },
      })
    );
    if (res.Item && res.Item.payload && res.Item.payload.S) {
      const parsed = JSON.parse(res.Item.payload.S);
      return {
        ...INITIAL_OFFICE_STATE,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error reading from DynamoDB:", err);
  }
  const initial = structuredClone(INITIAL_OFFICE_STATE);
  await saveState(initial);
  return initial;
}

async function saveState(state) {
  state.updatedAt = new Date().toISOString();
  await ddb.send(
    new PutItemCommand({
      TableName: OFFICE_TABLE,
      Item: {
        id: { S: STATE_KEY },
        payload: { S: JSON.stringify(state) },
        updatedAt: { S: state.updatedAt },
      },
    })
  );
  return state;
}

async function serveS3Asset(rawPath) {
  let key = (rawPath || "/").replace(/^\/+/, "");
  if (!key || key.endsWith("/")) {
    key = key + "index.html";
  } else if (!key.includes(".")) {
    key = key + "/index.html";
  }

  const dotIdx = key.lastIndexOf(".");
  const ext = dotIdx !== -1 ? key.slice(dotIdx).toLowerCase() : ".html";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const isBinary = BINARY_EXTS.has(ext);

  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: FRONTEND_BUCKET,
        Key: key,
      })
    );
    const bytes = await obj.Body.transformToByteArray();
    const buf = Buffer.from(bytes);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": key.startsWith("_next/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=60",
      },
      body: isBinary ? buf.toString("base64") : buf.toString("utf8"),
      isBase64Encoded: isBinary,
    };
  } catch (err) {
    // Fallback to index.html for SPA routes
    if (key !== "index.html") {
      return serveS3Asset("/index.html");
    }
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: "404 Not Found",
    };
  }
}

exports.handler = async (event) => {
  const method =
    event.httpMethod ||
    event.requestContext?.http?.method ||
    "GET";
  const rawPath = event.rawPath || event.path || "/";

  if (method === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  try {
    // API endpoints: /office or /api/office
    if (rawPath === "/office" || rawPath.startsWith("/office/") || rawPath.startsWith("/api/office")) {
      if (method === "GET") {
        const state = await loadState();
        return jsonResponse(200, { ok: true, data: state });
      }

      if (method === "POST") {
        const body = event.body ? JSON.parse(event.body) : {};
        const { action } = body;
        const state = await loadState();

        if (action === "sync_full_state" && body.state) {
          const updated = await saveState({ ...state, ...body.state });
          return jsonResponse(200, { ok: true, data: updated });
        }

        if (action === "add_todo") {
          state.todos.unshift({
            id: `todo-${Date.now()}`,
            title: String(body.title || "New Task").trim(),
            category: body.category || "Engineering",
            priority: body.priority || "high",
            completed: false,
            estimatedMinutes: Number(body.estimatedMinutes) || 30,
            createdAt: new Date().toISOString(),
          });
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "toggle_todo") {
          const target = state.todos.find((t) => t.id === body.todoId);
          if (target) {
            target.completed = !target.completed;
            target.completedAt = target.completed
              ? new Date().toISOString()
              : undefined;
          }
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "delete_todo") {
          state.todos = state.todos.filter((t) => t.id !== body.todoId);
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "clear_completed_todos") {
          state.todos = state.todos.filter((t) => !t.completed);
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "add_activity") {
          state.activities.push({
            id: `act-${Date.now()}`,
            title: String(body.title || "New Activity").trim(),
            description: String(body.description || "").trim(),
            timeSlot: String(body.timeSlot || "11:00 - 12:00").trim(),
            durationMinutes: Number(body.durationMinutes) || 60,
            stage: body.stage || "planned",
            colorTag: body.colorTag || "#38bdf8",
            linkedTodoId: body.linkedTodoId || undefined,
          });
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "update_activity_stage") {
          const target = state.activities.find((a) => a.id === body.activityId);
          if (target) {
            const nextStage = body.stage;
            target.stage = nextStage;
            if (nextStage === "active") {
              target.startedAt = new Date().toISOString();
              state.focusSession = {
                ...state.focusSession,
                activeActivityId: target.id,
                activeActivityTitle: target.title,
                durationSeconds: (target.durationMinutes || 25) * 60,
                remainingSeconds: (target.durationMinutes || 25) * 60,
                isRunning: true,
              };
            } else if (nextStage === "completed") {
              target.completedAt = new Date().toISOString();
              if (target.linkedTodoId) {
                const linked = state.todos.find(
                  (t) => t.id === target.linkedTodoId
                );
                if (linked && !linked.completed) {
                  linked.completed = true;
                  linked.completedAt = new Date().toISOString();
                }
              }
              if (state.focusSession.activeActivityId === target.id) {
                state.focusSession.isRunning = false;
                state.focusSession.completedSessionsToday =
                  (state.focusSession.completedSessionsToday || 0) + 1;
              }
            }
          }
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "delete_activity") {
          state.activities = state.activities.filter(
            (a) => a.id !== body.activityId
          );
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "add_sticky_note") {
          state.stickyNotes.unshift({
            id: `note-${Date.now()}`,
            text: String(body.text || "").trim(),
            color: body.color || "#fef08a",
            author: String(body.author || state.ownerName).trim(),
            createdAt: new Date().toISOString(),
          });
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "delete_sticky_note") {
          state.stickyNotes = state.stickyNotes.filter(
            (n) => n.id !== body.noteId
          );
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "update_scratchpad") {
          state.scratchpadText = String(body.scratchpadText ?? "");
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "add_quick_link") {
          state.quickLinks.push({
            id: `link-${Date.now()}`,
            label: String(body.label || "Resource").trim(),
            url: String(body.url || "https://").trim(),
            category: String(body.category || "Work").trim(),
          });
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "delete_quick_link") {
          state.quickLinks = state.quickLinks.filter(
            (l) => l.id !== body.linkId
          );
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        if (action === "update_focus_session") {
          state.focusSession = {
            ...state.focusSession,
            ...(body.focusSession || {}),
          };
          await saveState(state);
          return jsonResponse(200, { ok: true, data: state });
        }

        return jsonResponse(400, { ok: false, error: "Unknown action" });
      }
    }

    // For all other GET requests, serve the static 3D Office frontend from S3 over HTTPS!
    if (method === "GET") {
      return await serveS3Asset(rawPath);
    }

    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error("Workstation Lambda Error:", err);
    return jsonResponse(500, {
      ok: false,
      error: err?.message || "Internal server error",
    });
  }
};
