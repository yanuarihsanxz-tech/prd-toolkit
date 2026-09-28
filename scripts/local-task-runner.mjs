#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PLAN_PATH = "TASKS.json";
const DEFAULT_STATE_PATH = ".prd/task-state.json";
const PLAN_SCHEMA_VERSION = 2;
const STATE_SCHEMA_VERSION = 2;
const MUTATING_COMMANDS = new Set([
  "approve-plan",
  "authorize-run",
  "approve",
  "start",
  "complete",
  "fail",
  "retry",
]);
const ALL_COMMANDS = new Set([
  "next",
  "status",
  ...MUTATING_COMMANDS,
]);
const COMMANDS_WITH_REF = new Set([
  "authorize-run",
  "approve",
  "start",
  "complete",
  "fail",
  "retry",
]);
const VERIFICATION_METHODS = new Set([
  "command",
  "inspection",
  "test",
  "build",
  "lint",
  "typecheck",
  "smoke",
  "manual",
]);
const EXECUTION_MODES = new Set([
  "read_only",
  "dry_run",
  "local_test",
  "staging",
  "production",
]);
const FAILURE_CLASSIFICATIONS = new Set([
  "REQUIREMENT_AMBIGUOUS",
  "CODE_FAILED",
  "TEST_FAILED",
  "TEST_FLAKY",
  "MOCK_INVALID",
  "CONTRACT_UNVERIFIED",
  "SCHEMA_MISMATCH",
  "DATA_STALE",
  "ENVIRONMENT_BLOCKED",
  "EXTERNAL_DEPENDENCY_FAILED",
  "CONFIGURATION_INACTIVE",
  "OPERATOR_DECISION_REQUIRED",
  "EVIDENCE_STALE",
  "OPERATIONAL_STATE_STALE",
  "RESOURCE_BUDGET_EXCEEDED",
]);

function takeOptionValue(tokens, index, option) {
  const value = tokens[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function parseArguments(argv) {
  const [command, ...tokens] = argv;
  const ref =
    COMMANDS_WITH_REF.has(command) &&
    tokens[0] &&
    !tokens[0].startsWith("--")
      ? tokens.shift()
      : undefined;
  const options = {
    command,
    ref,
    reason: "",
    planPath: DEFAULT_PLAN_PATH,
    statePath: DEFAULT_STATE_PATH,
    json: false,
    actor: "",
    evidence: "",
    sourceState: "",
    classification: "",
    checks: "",
    fingerprint: "",
  };

  const positionals = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const value = tokens[index];
    if (value === "--plan") {
      options.planPath = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--state") {
      options.statePath = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--actor") {
      options.actor = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--evidence") {
      options.evidence = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--source-state") {
      options.sourceState = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--classification") {
      options.classification = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--checks") {
      options.checks = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--fingerprint") {
      options.fingerprint = takeOptionValue(tokens, index, value);
      index += 1;
    } else if (value === "--json") {
      options.json = true;
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      positionals.push(value);
    }
  }
  options.reason = positionals.join(" ").trim();
  return options;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return structuredClone(fallback);
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      mode: 0o600,
      flag: "wx",
    });
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

function withStateLock(statePath, callback) {
  const directory = path.dirname(statePath);
  fs.mkdirSync(directory, { recursive: true });
  const lockPath = `${statePath}.lock`;
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(
      descriptor,
      `${JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() })}\n`,
    );
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        `State lock exists at ${lockPath}. Inspect the recorded PID and process state; do not delete an active lock.`,
      );
    }
    throw error;
  }

  try {
    return callback();
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function fingerprintPlan(plan) {
  return `sha256:${crypto.createHash("sha256").update(canonicalJson(plan)).digest("hex")}`;
}

function requireExactKeys(value, allowedKeys, context) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  const extras = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (extras.length > 0) {
    throw new Error(`${context} contains unsupported fields: ${extras.join(", ")}.`);
  }
}

function requireString(value, context, pattern) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${context} requires a non-empty string.`);
  }
  if (pattern && !pattern.test(value)) {
    throw new Error(`${context} has invalid format: ${value}.`);
  }
}

function requireStringArray(value, context, { minItems = 0, pattern } = {}) {
  if (!Array.isArray(value) || value.length < minItems) {
    throw new Error(`${context} requires at least ${minItems} item(s).`);
  }
  if (new Set(value).size !== value.length) {
    throw new Error(`${context} contains duplicate values.`);
  }
  value.forEach((item, index) =>
    requireString(item, `${context}[${index}]`, pattern),
  );
}

function requireProjectRelativePath(value, context, { allowGlob = false } = {}) {
  requireString(value, context);
  if (
    path.isAbsolute(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("~") ||
    value.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`${context} must remain inside the target project: ${value}.`);
  }
  if (!allowGlob && /[*?{}[\]]/.test(value)) {
    throw new Error(`${context} cannot contain a glob: ${value}.`);
  }
  if ([".", "./", "*", "**", "**/*"].includes(value)) {
    throw new Error(`${context} is too broad: ${value}.`);
  }
}

function validatePlan(plan) {
  requireExactKeys(plan, ["schema_version", "plan", "tasks"], "TASKS.json");
  if (plan.schema_version !== PLAN_SCHEMA_VERSION) {
    throw new Error(
      `TASKS.json must use schema_version ${PLAN_SCHEMA_VERSION}; preserve any v1 plan/state as historical evidence and generate a new v2 plan.`,
    );
  }

  requireExactKeys(
    plan.plan,
    [
      "id",
      "title",
      "prd",
      "prd_version",
      "source_fingerprint",
      "generated_at",
    ],
    "Plan metadata",
  );
  requireString(plan.plan.id, "Plan id", /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
  requireString(plan.plan.title, "Plan title");
  requireString(plan.plan.prd, "Plan PRD path");
  requireProjectRelativePath(plan.plan.prd, "Plan PRD path");
  requireString(plan.plan.prd_version, "Plan PRD version", /^\d+\.\d+\.\d+$/);
  requireString(
    plan.plan.source_fingerprint,
    "Plan source_fingerprint",
    /^(git|sha256|manifest-sha256):[A-Za-z0-9][A-Za-z0-9._:+-]*$/,
  );
  if (/REPLACE|PLACEHOLDER|UNVERIFIED/i.test(plan.plan.source_fingerprint)) {
    throw new Error(
      "Plan source_fingerprint is still a placeholder; bind the plan to the current secret-free source state before approval.",
    );
  }
  requireString(
    plan.plan.generated_at,
    "Plan generated_at",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
  );
  if (Number.isNaN(Date.parse(plan.plan.generated_at))) {
    throw new Error("Plan generated_at must be an ISO-8601 date-time.");
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new Error("Plan requires at least one ordered task.");
  }
  if (plan.tasks.length > 10000) {
    throw new Error("Plan cannot contain more than 10000 ordered tasks.");
  }

  const references = new Set();
  const phases = [];
  for (const [index, task] of plan.tasks.entries()) {
    const context = `Task at index ${index}`;
    requireExactKeys(
      task,
      [
        "ref",
        "title",
        "objective",
        "layer",
        "phase",
        "phase_total",
        "page",
        "requirement_ids",
        "acceptance_criteria_ids",
        "depends_on",
        "allowed_paths",
        "forbidden_paths",
        "verification",
        "authority",
        "max_attempts",
      ],
      context,
    );
    requireString(task.ref, `${context} ref`, /^[A-Z0-9][A-Z0-9._-]*$/);
    requireString(task.title, `Task ${task.ref} title`);
    requireString(task.objective, `Task ${task.ref} objective`);
    requireString(task.layer, `Task ${task.ref} layer`, /^[a-z][a-z0-9_-]*$/);
    if (!Number.isInteger(task.phase) || task.phase < 1) {
      throw new Error(`Task ${task.ref} requires a positive integer phase.`);
    }
    if (!Number.isInteger(task.phase_total) || task.phase_total < task.phase) {
      throw new Error(
        `Task ${task.ref} has an invalid phase_total (${task.phase_total}).`,
      );
    }
    if (index > 0 && task.phase < plan.tasks[index - 1].phase) {
      throw new Error(`Task ${task.ref} moves backward to an earlier phase.`);
    }
    if (task.page !== null && typeof task.page !== "string") {
      throw new Error(`Task ${task.ref} page must be a string or null.`);
    }
    if (references.has(task.ref)) {
      throw new Error(`Duplicate task ref: ${task.ref}`);
    }

    requireStringArray(task.requirement_ids, `Task ${task.ref} requirement_ids`, {
      minItems: 1,
      pattern: /^(FR|NFR)-\d{3}$/,
    });
    requireStringArray(
      task.acceptance_criteria_ids,
      `Task ${task.ref} acceptance_criteria_ids`,
      { minItems: 1, pattern: /^AC-\d{3}$/ },
    );
    requireStringArray(task.depends_on, `Task ${task.ref} depends_on`, {
      pattern: /^[A-Z0-9][A-Z0-9._-]*$/,
    });
    for (const dependency of task.depends_on) {
      if (!references.has(dependency)) {
        throw new Error(
          `Task ${task.ref} dependency ${dependency} must reference an earlier task.`,
        );
      }
    }
    requireStringArray(task.allowed_paths, `Task ${task.ref} allowed_paths`, {
      minItems: 1,
    });
    requireStringArray(task.forbidden_paths, `Task ${task.ref} forbidden_paths`, {
      minItems: 1,
    });
    task.allowed_paths.forEach((candidate, pathIndex) =>
      requireProjectRelativePath(
        candidate,
        `Task ${task.ref} allowed_paths[${pathIndex}]`,
        { allowGlob: true },
      ),
    );
    task.forbidden_paths.forEach((candidate, pathIndex) =>
      requireProjectRelativePath(
        candidate,
        `Task ${task.ref} forbidden_paths[${pathIndex}]`,
        { allowGlob: true },
      ),
    );
    const overlappingPaths = task.allowed_paths.filter((candidate) =>
      task.forbidden_paths.includes(candidate),
    );
    if (overlappingPaths.length > 0) {
      throw new Error(
        `Task ${task.ref} has paths that are both allowed and forbidden: ${overlappingPaths.join(", ")}.`,
      );
    }

    if (!Array.isArray(task.verification) || task.verification.length === 0) {
      throw new Error(`Task ${task.ref} requires at least one verification contract.`);
    }
    const verificationIds = new Set();
    for (const verification of task.verification) {
      requireExactKeys(
        verification,
        [
          "id",
          "method",
          "environment",
          "procedure",
          "expected_result",
          "evidence_required",
          "timeout_seconds",
          "cleanup",
        ],
        `Task ${task.ref} verification`,
      );
      requireString(verification.id, `Task ${task.ref} verification id`, /^VER-\d{3}$/);
      if (verificationIds.has(verification.id)) {
        throw new Error(`Task ${task.ref} has duplicate verification id ${verification.id}.`);
      }
      verificationIds.add(verification.id);
      if (!VERIFICATION_METHODS.has(verification.method)) {
        throw new Error(
          `Task ${task.ref} verification ${verification.id} has invalid method ${verification.method}.`,
        );
      }
      requireString(verification.environment, `Verification ${verification.id} environment`);
      requireString(verification.procedure, `Verification ${verification.id} procedure`);
      requireString(
        verification.expected_result,
        `Verification ${verification.id} expected_result`,
      );
      requireString(
        verification.evidence_required,
        `Verification ${verification.id} evidence_required`,
      );
      if (
        !Number.isInteger(verification.timeout_seconds) ||
        verification.timeout_seconds < 1 ||
        verification.timeout_seconds > 86400
      ) {
        throw new Error(
          `Verification ${verification.id} timeout_seconds must be between 1 and 86400.`,
        );
      }
      requireString(verification.cleanup, `Verification ${verification.id} cleanup`);
    }

    requireExactKeys(
      task.authority,
      [
        "execution_mode",
        "allowed_side_effects",
        "forbidden_side_effects",
        "requires_owner_authorization",
      ],
      `Task ${task.ref} authority`,
    );
    if (!EXECUTION_MODES.has(task.authority.execution_mode)) {
      throw new Error(
        `Task ${task.ref} has invalid execution_mode ${task.authority.execution_mode}.`,
      );
    }
    requireStringArray(
      task.authority.allowed_side_effects,
      `Task ${task.ref} allowed_side_effects`,
    );
    requireStringArray(
      task.authority.forbidden_side_effects,
      `Task ${task.ref} forbidden_side_effects`,
      { minItems: 1 },
    );
    if (typeof task.authority.requires_owner_authorization !== "boolean") {
      throw new Error(
        `Task ${task.ref} requires_owner_authorization must be boolean.`,
      );
    }
    if (
      task.authority.execution_mode === "production" &&
      !task.authority.requires_owner_authorization
    ) {
      throw new Error(
        `Task ${task.ref} production mode requires explicit owner authorization.`,
      );
    }
    if (
      !Number.isInteger(task.max_attempts) ||
      task.max_attempts < 1 ||
      task.max_attempts > 10
    ) {
      throw new Error(`Task ${task.ref} max_attempts must be between 1 and 10.`);
    }

    references.add(task.ref);
    phases.push(task.phase);
  }

  const maximumPhase = Math.max(...phases);
  const expectedPhases = Array.from({ length: maximumPhase }, (_, index) => index + 1);
  const actualPhases = [...new Set(phases)];
  if (actualPhases.join(",") !== expectedPhases.join(",")) {
    throw new Error(
      `Plan phases must be contiguous from 1 through ${maximumPhase}; found ${actualPhases.join(", ")}.`,
    );
  }
  for (const task of plan.tasks) {
    if (task.phase_total !== maximumPhase) {
      throw new Error(
        `Task ${task.ref} phase_total must equal plan maximum phase ${maximumPhase}.`,
      );
    }
  }
}

function initialState(plan, planFingerprint) {
  return {
    schema_version: STATE_SCHEMA_VERSION,
    revision: 0,
    plan_id: plan.plan.id,
    plan_fingerprint: planFingerprint,
    source_fingerprint: plan.plan.source_fingerprint,
    plan_approval: null,
    run_authorization: null,
    active_task: null,
    approved_transition: null,
    last_completed: null,
    tasks: {},
    event_log: [],
  };
}

function validateState(state, plan, planFingerprint) {
  requireExactKeys(
    state,
    [
      "schema_version",
      "revision",
      "plan_id",
      "plan_fingerprint",
      "source_fingerprint",
      "plan_approval",
      "run_authorization",
      "active_task",
      "approved_transition",
      "last_completed",
      "tasks",
      "event_log",
    ],
    "Task state",
  );
  if (state.schema_version !== STATE_SCHEMA_VERSION) {
    throw new Error(
      `Task state must use schema_version ${STATE_SCHEMA_VERSION}; preserve v1 state as historical evidence and start a separately approved v2 plan.`,
    );
  }
  if (state.plan_id !== plan.plan.id) {
    throw new Error(
      `State belongs to plan ${state.plan_id}, not ${plan.plan.id}.`,
    );
  }
  if (state.plan_fingerprint !== planFingerprint) {
    throw new Error(
      `PLAN_CHANGED: state is bound to ${state.plan_fingerprint}, but TASKS.json is ${planFingerprint}. Preserve the old state and obtain approval for a new plan id/state; approval cannot be reused.`,
    );
  }
  if (state.source_fingerprint !== plan.plan.source_fingerprint) {
    throw new Error(
      "PLAN_CHANGED: source_fingerprint differs from the approved state binding.",
    );
  }
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    throw new Error("Task state revision must be a non-negative integer.");
  }
  if (!Array.isArray(state.event_log)) {
    throw new Error("Task state event_log must be an array.");
  }
  if (state.revision !== state.event_log.length) {
    throw new Error(
      `Task state revision ${state.revision} does not match event count ${state.event_log.length}.`,
    );
  }
  state.event_log.forEach((event, index) => {
    requireExactKeys(
      event,
      [
        "sequence",
        "at",
        "type",
        "task_ref",
        "actor",
        "evidence",
        "source_state",
        "plan_fingerprint",
        "details",
      ],
      `Task state event ${index + 1}`,
    );
    if (event.sequence !== index + 1) {
      throw new Error(`Task state event sequence is invalid at index ${index}.`);
    }
    if (event.plan_fingerprint !== planFingerprint) {
      throw new Error(
        `Task state event ${event.sequence} belongs to a different plan fingerprint.`,
      );
    }
  });
  if (!state.tasks || typeof state.tasks !== "object" || Array.isArray(state.tasks)) {
    throw new Error("Task state tasks must be an object.");
  }
  const planByRef = new Map(plan.tasks.map((task) => [task.ref, task]));
  const inProgress = [];
  for (const [ref, record] of Object.entries(state.tasks)) {
    const task = planByRef.get(ref);
    if (!task) throw new Error(`Task state contains unknown task ${ref}.`);
    requireExactKeys(
      record,
      [
        "status",
        "attempts",
        "started_at",
        "completed_at",
        "failed_at",
        "last_failure",
        "retry_authorization",
      ],
      `Task ${ref} state`,
    );
    if (!["pending", "in_progress", "completed", "failed"].includes(record.status)) {
      throw new Error(`Task ${ref} has invalid state status ${record.status}.`);
    }
    if (!Array.isArray(record.attempts)) {
      throw new Error(`Task ${ref} state attempts must be an array.`);
    }
    if (record.attempts.length > task.max_attempts) {
      throw new Error(
        `Task ${ref} state exceeds max_attempts (${task.max_attempts}).`,
      );
    }
    record.attempts.forEach((attempt, index) => {
      if (attempt.number !== index + 1) {
        throw new Error(`Task ${ref} attempt numbering is invalid at index ${index}.`);
      }
    });
    if (record.status === "in_progress") inProgress.push(ref);
    if (record.status === "failed" && !record.last_failure) {
      throw new Error(`Failed task ${ref} lacks last_failure evidence.`);
    }
    if (
      record.status === "completed" &&
      !record.attempts.at(-1)?.completion
    ) {
      throw new Error(`Completed task ${ref} lacks completion evidence.`);
    }
  }
  if (inProgress.length > 1) {
    throw new Error(`Multiple tasks are in progress: ${inProgress.join(", ")}.`);
  }
  if (state.active_task === null && inProgress.length > 0) {
    throw new Error(`Task ${inProgress[0]} is in progress but active_task is null.`);
  }
  if (
    state.active_task !== null &&
    (inProgress.length !== 1 || inProgress[0] !== state.active_task)
  ) {
    throw new Error(
      `active_task ${state.active_task} does not match the in-progress task state.`,
    );
  }
  if (state.last_completed) {
    if (taskStatus(state, state.last_completed.ref) !== "completed") {
      throw new Error("last_completed does not reference a completed task.");
    }
    if (state.last_completed.plan_fingerprint !== planFingerprint) {
      throw new Error("last_completed belongs to a different plan fingerprint.");
    }
  }
  if (
    state.plan_approval &&
    state.plan_approval.plan_fingerprint !== planFingerprint
  ) {
    throw new Error("Stored plan approval does not match the current plan fingerprint.");
  }
  if (state.run_authorization) {
    const authorization = state.run_authorization;
    requireExactKeys(
      authorization,
      [
        "authorization_version",
        "authorized_at",
        "authorized_by",
        "evidence",
        "from_task_ref",
        "through_task_ref",
        "task_refs",
        "execution_modes",
        "plan_fingerprint",
        "source_fingerprint",
      ],
      "Run authorization",
    );
    if (authorization.authorization_version !== 1) {
      throw new Error("Run authorization must use authorization_version 1.");
    }
    requireString(authorization.authorized_at, "Run authorization authorized_at");
    if (Number.isNaN(Date.parse(authorization.authorized_at))) {
      throw new Error("Run authorization authorized_at must be an ISO-8601 date-time.");
    }
    requireString(authorization.authorized_by, "Run authorization authorized_by");
    requireString(authorization.evidence, "Run authorization evidence");
    requireString(
      authorization.from_task_ref,
      "Run authorization from_task_ref",
      /^[A-Z0-9][A-Z0-9._-]*$/,
    );
    requireString(
      authorization.through_task_ref,
      "Run authorization through_task_ref",
      /^[A-Z0-9][A-Z0-9._-]*$/,
    );
    requireStringArray(authorization.task_refs, "Run authorization task_refs", {
      minItems: 1,
      pattern: /^[A-Z0-9][A-Z0-9._-]*$/,
    });
    requireStringArray(
      authorization.execution_modes,
      "Run authorization execution_modes",
      { minItems: 1 },
    );
    if (
      authorization.plan_fingerprint !== planFingerprint ||
      authorization.source_fingerprint !== state.source_fingerprint
    ) {
      throw new Error(
        "Stored run authorization does not match the current plan/source fingerprint.",
      );
    }
    const authorizedTasks = authorization.task_refs.map((ref) => planByRef.get(ref));
    if (authorizedTasks.some((task) => !task)) {
      throw new Error("Run authorization references an unknown task.");
    }
    if (
      authorization.task_refs[0] !== authorization.from_task_ref ||
      authorization.task_refs.at(-1) !== authorization.through_task_ref
    ) {
      throw new Error("Run authorization bounds do not match its task_refs.");
    }
    const fromIndex = plan.tasks.findIndex(
      (task) => task.ref === authorization.from_task_ref,
    );
    const throughIndex = plan.tasks.findIndex(
      (task) => task.ref === authorization.through_task_ref,
    );
    const expectedRefs = plan.tasks
      .slice(fromIndex, throughIndex + 1)
      .map((task) => task.ref);
    if (expectedRefs.join(",") !== authorization.task_refs.join(",")) {
      throw new Error("Run authorization task_refs must be one contiguous plan range.");
    }
    if (authorizedTasks.some((task) => task.authority.execution_mode === "production")) {
      throw new Error("Run authorization cannot cover production tasks.");
    }
  }
  if (
    state.approved_transition &&
    state.approved_transition.plan_fingerprint !== planFingerprint
  ) {
    throw new Error(
      "Stored transition approval does not match the current plan fingerprint.",
    );
  }
  if (
    state.approved_transition &&
    !planByRef.has(state.approved_transition.task_ref)
  ) {
    throw new Error("Stored transition approval references an unknown task.");
  }
}

function appendEvent(state, type, details = {}) {
  state.event_log.push({
    sequence: state.event_log.length + 1,
    at: new Date().toISOString(),
    type,
    task_ref: details.task_ref ?? null,
    actor: details.actor ?? null,
    evidence: details.evidence ?? null,
    source_state: details.source_state ?? null,
    plan_fingerprint: state.plan_fingerprint,
    details: details.details ?? null,
  });
}

function taskStatus(state, ref) {
  return state.tasks[ref]?.status ?? "pending";
}

function failedTask(plan, state) {
  return (
    plan.tasks.find((task) => taskStatus(state, task.ref) === "failed") ?? null
  );
}

function getCandidate(plan, state) {
  if (state.active_task) {
    return plan.tasks.find((task) => task.ref === state.active_task) ?? null;
  }
  return (
    plan.tasks.find((task) => taskStatus(state, task.ref) === "pending") ?? null
  );
}

function isPlanApproved(state) {
  return (
    state.plan_approval?.plan_fingerprint === state.plan_fingerprint &&
    state.plan_approval?.source_fingerprint === state.source_fingerprint
  );
}

function checkpointFor(task, state) {
  if (!task) return { required: false, reasons: [] };

  const reasons = [];
  // Phase and layer are progress metadata. The exact approved plan already
  // authorizes ordinary local non-production milestone transitions. Only a
  // declared authority boundary creates a checkpoint.
  if (task.authority.requires_owner_authorization) {
    reasons.push("owner_authorization_required");
  }

  const approvalMatches =
    state.approved_transition?.task_ref === task.ref &&
    state.approved_transition?.plan_fingerprint === state.plan_fingerprint;
  const runAuthorizationMatches =
    state.run_authorization?.plan_fingerprint === state.plan_fingerprint &&
    state.run_authorization?.source_fingerprint === state.source_fingerprint &&
    state.run_authorization?.task_refs?.includes(task.ref);
  return {
    required: reasons.length > 0 && !approvalMatches && !runAuthorizationMatches,
    reasons,
    approval: approvalMatches ? state.approved_transition : null,
    run_authorization: runAuthorizationMatches ? state.run_authorization : null,
  };
}

function progressFor(task) {
  return {
    layer: task.layer,
    phase: {
      current: task.phase,
      total: task.phase_total,
    },
    page: task.page,
  };
}

function summarize(plan, state) {
  const counts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  };
  for (const task of plan.tasks) {
    const status = taskStatus(state, task.ref);
    counts[status] = (counts[status] ?? 0) + 1;
  }
  const blocked = failedTask(plan, state);
  return {
    total: plan.tasks.length,
    ...counts,
    blocked: Boolean(blocked) || !isPlanApproved(state),
    blocked_by: blocked?.ref ?? (!isPlanApproved(state) ? "plan_approval" : null),
    active_task: state.active_task,
    last_completed: state.last_completed,
    revision: state.revision,
    plan_fingerprint: state.plan_fingerprint,
    source_fingerprint: state.source_fingerprint,
    plan_approval: state.plan_approval,
    run_authorization: state.run_authorization ?? null,
  };
}

function nextResult(plan, state) {
  const summary = summarize(plan, state);
  if (!isPlanApproved(state)) {
    return {
      done: false,
      blocked: true,
      block: {
        type: "plan_approval_required",
        message:
          "Approve the exact plan fingerprint before starting any task.",
        plan_fingerprint: state.plan_fingerprint,
        source_fingerprint: state.source_fingerprint,
      },
      candidate: getCandidate(plan, state),
      summary,
    };
  }

  const failed = failedTask(plan, state);
  if (failed) {
    const record = state.tasks[failed.ref];
    return {
      done: false,
      blocked: true,
      block: {
        type: "failed_task",
        task_ref: failed.ref,
        classification: record.last_failure?.classification ?? null,
        reason: record.last_failure?.reason ?? null,
        attempts: record.attempts?.length ?? 0,
        max_attempts: failed.max_attempts,
        next_action:
          "Resolve the blocker, then retry the same task with evidence. The builder may authorize an in-scope local retry; owner approval is required only for new authority, changed scope, or owner input.",
      },
      summary,
    };
  }

  const task = getCandidate(plan, state);
  if (!task) {
    return {
      done: true,
      blocked: false,
      plan: plan.plan,
      summary,
    };
  }

  return {
    done: false,
    blocked: false,
    active: state.active_task === task.ref,
    task,
    progress: progressFor(task),
    checkpoint:
      state.active_task === task.ref
        ? { required: false, reasons: [], approval: null }
        : checkpointFor(task, state),
  };
}

function requirePlanApproval(state) {
  if (!isPlanApproved(state)) {
    throw new Error(
      `Plan approval required for fingerprint ${state.plan_fingerprint}; use approve-plan with --actor and --evidence.`,
    );
  }
}

function requireCandidate(plan, state, ref) {
  const blocked = failedTask(plan, state);
  if (blocked) {
    throw new Error(
      `Plan blocked by failed task ${blocked.ref}; resolve and retry it before any later task.`,
    );
  }
  const candidate = getCandidate(plan, state);
  if (!candidate) throw new Error("No remaining task is available.");
  if (candidate.ref !== ref) {
    throw new Error(
      `Expected next task ${candidate.ref}; refusing out-of-order task ${ref}.`,
    );
  }
  return candidate;
}

function requireEvidence(options, action, { actor = false, source = false } = {}) {
  if (actor && !options.actor) {
    throw new Error(`${action} requires --actor.`);
  }
  if (options.actor.length > 200) {
    throw new Error(`${action} --actor exceeds 200 characters.`);
  }
  if (!options.evidence) {
    throw new Error(`${action} requires secret-free --evidence.`);
  }
  if (options.evidence.length > 2000) {
    throw new Error(`${action} --evidence exceeds 2000 characters.`);
  }
  if (source && !options.sourceState) {
    throw new Error(`${action} requires --source-state.`);
  }
  if (source) {
    if (
      !/^(git|sha256|manifest-sha256):[A-Za-z0-9][A-Za-z0-9._:+-]*$/.test(
        options.sourceState,
      ) ||
      /REPLACE|PLACEHOLDER|UNVERIFIED/i.test(options.sourceState)
    ) {
      throw new Error(
        `${action} --source-state must be an exact git:, sha256:, or manifest-sha256: fingerprint.`,
      );
    }
    if (options.sourceState.length > 512) {
      throw new Error(`${action} --source-state exceeds 512 characters.`);
    }
  }
}

function applyCommand(options, plan, state) {
  const { command, ref } = options;

  if (command === "next") {
    return { result: nextResult(plan, state), changed: false };
  }

  if (command === "status") {
    const next = nextResult(plan, state);
    return {
      result: {
        plan: plan.plan,
        summary: summarize(plan, state),
        block: next.block ?? null,
        tasks: plan.tasks.map((task) => ({
          ref: task.ref,
          title: task.title,
          layer: task.layer,
          phase: task.phase,
          status: taskStatus(state, task.ref),
          attempts: state.tasks[task.ref]?.attempts?.length ?? 0,
          max_attempts: task.max_attempts,
          last_failure: state.tasks[task.ref]?.last_failure ?? null,
        })),
        event_count: state.event_log.length,
      },
      changed: false,
    };
  }

  if (command === "approve-plan") {
    requireEvidence(options, "approve-plan", { actor: true });
    if (isPlanApproved(state)) {
      throw new Error(
        `Plan ${state.plan_id} is already approved for ${state.plan_fingerprint}.`,
      );
    }
    const approval = {
      approved_at: new Date().toISOString(),
      approved_by: options.actor,
      evidence: options.evidence,
      plan_fingerprint: state.plan_fingerprint,
      source_fingerprint: state.source_fingerprint,
    };
    state.plan_approval = approval;
    appendEvent(state, "plan_approved", {
      actor: options.actor,
      evidence: options.evidence,
      details: {
        plan_id: state.plan_id,
        source_fingerprint: state.source_fingerprint,
      },
    });
    return {
      result: { approved: true, plan: state.plan_id, approval },
      changed: true,
    };
  }

  requirePlanApproval(state);

  if (!ref) {
    throw new Error(`${command} requires a task ref.`);
  }

  if (command === "authorize-run") {
    requireEvidence(options, "authorize-run", { actor: true });
    if (!options.fingerprint) {
      throw new Error("authorize-run requires --fingerprint.");
    }
    if (options.fingerprint !== state.plan_fingerprint) {
      throw new Error(
        `authorize-run fingerprint mismatch: expected ${state.plan_fingerprint}.`,
      );
    }
    if (state.active_task) {
      throw new Error(
        `Task ${state.active_task} is already active; run authorization must be recorded at a checkpoint.`,
      );
    }
    const blocked = failedTask(plan, state);
    if (blocked) {
      throw new Error(
        `Plan blocked by failed task ${blocked.ref}; authorize-run cannot bypass failure/retry authorization.`,
      );
    }
    const candidate = getCandidate(plan, state);
    if (!candidate) {
      throw new Error("No remaining task is available for run authorization.");
    }
    const fromIndex = plan.tasks.findIndex((task) => task.ref === candidate.ref);
    const throughIndex = plan.tasks.findIndex((task) => task.ref === ref);
    if (throughIndex < 0) {
      throw new Error(`authorize-run through task ${ref} does not exist in the plan.`);
    }
    if (throughIndex < fromIndex) {
      throw new Error(
        `authorize-run through task ${ref} precedes the current candidate ${candidate.ref}.`,
      );
    }
    const authorizedTasks = plan.tasks.slice(fromIndex, throughIndex + 1);
    const productionTasks = authorizedTasks
      .filter((task) => task.authority.execution_mode === "production")
      .map((task) => task.ref);
    if (productionTasks.length > 0) {
      throw new Error(
        `authorize-run cannot cover production tasks: ${productionTasks.join(", ")}.`,
      );
    }
    const authorization = {
      authorization_version: 1,
      authorized_at: new Date().toISOString(),
      authorized_by: options.actor,
      evidence: options.evidence,
      from_task_ref: candidate.ref,
      through_task_ref: ref,
      task_refs: authorizedTasks.map((task) => task.ref),
      execution_modes: [
        ...new Set(authorizedTasks.map((task) => task.authority.execution_mode)),
      ],
      plan_fingerprint: state.plan_fingerprint,
      source_fingerprint: state.source_fingerprint,
    };
    state.run_authorization = authorization;
    appendEvent(state, "run_authorized", {
      actor: options.actor,
      evidence: options.evidence,
      details: {
        from_task_ref: candidate.ref,
        through_task_ref: ref,
        task_count: authorizedTasks.length,
        execution_modes: authorization.execution_modes,
      },
    });
    return {
      result: {
        authorized: true,
        authorization,
        stop_conditions: [
          "failed_task",
          "retry_authorization_required",
          "PLAN_CHANGED",
          "state_lock",
          "task_after_through_task_ref",
        ],
      },
      changed: true,
    };
  }

  if (command === "retry") {
    requireEvidence(options, "retry", { actor: true, source: true });
    if (state.active_task) {
      throw new Error(`Task ${state.active_task} is already active.`);
    }
    const blocked = failedTask(plan, state);
    if (!blocked) {
      throw new Error("No failed task is available for retry.");
    }
    if (blocked.ref !== ref) {
      throw new Error(
        `Plan is blocked by ${blocked.ref}; refusing retry for ${ref}.`,
      );
    }
    const record = state.tasks[ref];
    const attempts = record.attempts?.length ?? 0;
    if (attempts >= blocked.max_attempts) {
      throw new Error(
        `Task ${ref} exhausted max_attempts (${blocked.max_attempts}). Preserve this state and obtain an approved replacement plan; do not retry or advance.`,
      );
    }
    const authorization = {
      authorized_at: new Date().toISOString(),
      authorized_by: options.actor,
      evidence: options.evidence,
      source_state: options.sourceState,
      prior_failure: record.last_failure,
      plan_fingerprint: state.plan_fingerprint,
    };
    state.tasks[ref] = {
      ...record,
      status: "pending",
      retry_authorization: authorization,
    };
    appendEvent(state, "task_retry_authorized", {
      task_ref: ref,
      actor: options.actor,
      evidence: options.evidence,
      source_state: options.sourceState,
      details: { prior_failure: record.last_failure, attempts },
    });
    return {
      result: {
        retry_authorized: true,
        task: ref,
        attempts_used: attempts,
        attempts_remaining: blocked.max_attempts - attempts,
        authorization,
      },
      changed: true,
    };
  }

  const task = requireCandidate(plan, state, ref);

  if (command === "approve") {
    requireEvidence(options, "approve", { actor: true });
    if (state.active_task) {
      throw new Error(
        `Task ${state.active_task} is already active; approval must be recorded before start.`,
      );
    }
    const checkpoint = checkpointFor(task, state);
    if (checkpoint.reasons.length === 0) {
      throw new Error(`Task ${ref} does not require transition approval.`);
    }
    if (!checkpoint.required) {
      throw new Error(
        `Task ${ref} already has approval for the current plan fingerprint.`,
      );
    }
    const approval = {
      task_ref: ref,
      approved_at: new Date().toISOString(),
      approved_by: options.actor,
      evidence: options.evidence,
      reasons: checkpoint.reasons,
      from: state.last_completed,
      plan_fingerprint: state.plan_fingerprint,
      source_fingerprint: state.source_fingerprint,
    };
    state.approved_transition = approval;
    appendEvent(state, "task_transition_approved", {
      task_ref: ref,
      actor: options.actor,
      evidence: options.evidence,
      details: { reasons: checkpoint.reasons, from: state.last_completed },
    });
    return {
      result: { approved: true, task: ref, approval },
      changed: true,
    };
  }

  if (command === "start") {
    requireEvidence(options, "start", { source: true });
    if (state.active_task) {
      throw new Error(`Task ${state.active_task} is already active.`);
    }
    const checkpoint = checkpointFor(task, state);
    if (checkpoint.required) {
      throw new Error(
        `Checkpoint approval required for ${ref}: ${checkpoint.reasons.join(", ")}.`,
      );
    }
    const incompleteDependencies = task.depends_on.filter(
      (dependency) => taskStatus(state, dependency) !== "completed",
    );
    if (incompleteDependencies.length > 0) {
      throw new Error(
        `Task ${ref} has incomplete dependencies: ${incompleteDependencies.join(", ")}.`,
      );
    }
    const existing = state.tasks[ref] ?? { attempts: [] };
    const attempts = existing.attempts ?? [];
    if (attempts.length >= task.max_attempts) {
      throw new Error(
        `Task ${ref} exhausted max_attempts (${task.max_attempts}).`,
      );
    }
    const attempt = {
      number: attempts.length + 1,
      started_at: new Date().toISOString(),
      source_state: options.sourceState,
      preflight_evidence: options.evidence,
      transition_approval:
        state.approved_transition?.task_ref === ref
          ? structuredClone(state.approved_transition)
          : null,
      run_authorization: checkpoint.run_authorization
        ? structuredClone(checkpoint.run_authorization)
        : null,
      retry_authorization: existing.retry_authorization
        ? structuredClone(existing.retry_authorization)
        : null,
    };
    state.active_task = ref;
    state.tasks[ref] = {
      ...existing,
      status: "in_progress",
      attempts: [...attempts, attempt],
      started_at: attempt.started_at,
      retry_authorization: null,
    };
    appendEvent(state, "task_started", {
      task_ref: ref,
      evidence: options.evidence,
      source_state: options.sourceState,
      details: { attempt: attempt.number, authority: task.authority },
    });
    return {
      result: {
        started: true,
        task,
        attempt: attempt.number,
        progress: progressFor(task),
      },
      changed: true,
    };
  }

  if (state.active_task !== ref) {
    throw new Error(`Task ${ref} is not the active task.`);
  }

  if (command === "complete") {
    requireEvidence(options, "complete", { source: true });
    if (!options.checks) {
      throw new Error(
        "complete requires --checks with every verification ID, comma-separated.",
      );
    }
    const verifiedChecks = options.checks
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (new Set(verifiedChecks).size !== verifiedChecks.length) {
      throw new Error("complete --checks contains duplicate verification IDs.");
    }
    const requiredChecks = task.verification.map((item) => item.id).sort();
    if (verifiedChecks.sort().join(",") !== requiredChecks.join(",")) {
      throw new Error(
        `complete --checks must equal ${requiredChecks.join(",")}; received ${verifiedChecks.join(",") || "none"}.`,
      );
    }
    const completedAt = new Date().toISOString();
    const record = state.tasks[ref];
    const attempts = record.attempts ?? [];
    const attempt = attempts.at(-1);
    attempt.completed_at = completedAt;
    attempt.completion = {
      source_state: options.sourceState,
      evidence: options.evidence,
      verified_checks: requiredChecks,
    };
    state.tasks[ref] = {
      ...record,
      status: "completed",
      completed_at: completedAt,
    };
    state.last_completed = {
      ref,
      layer: task.layer,
      phase: task.phase,
      completed_at: completedAt,
      source_state: options.sourceState,
      evidence: options.evidence,
      plan_fingerprint: state.plan_fingerprint,
    };
    state.active_task = null;
    state.approved_transition = null;
    appendEvent(state, "task_completed", {
      task_ref: ref,
      evidence: options.evidence,
      source_state: options.sourceState,
      details: { attempt: attempt.number, verified_checks: requiredChecks },
    });
    return {
      result: {
        completed: true,
        task,
        attempt: attempt.number,
        verified_checks: requiredChecks,
        progress: progressFor(task),
      },
      changed: true,
    };
  }

  if (command === "fail") {
    requireEvidence(options, "fail", { source: true });
    if (!options.reason) {
      throw new Error("fail requires a concise reason after the task ref.");
    }
    if (options.reason.length > 1000) {
      throw new Error("fail reason exceeds 1000 characters.");
    }
    if (!FAILURE_CLASSIFICATIONS.has(options.classification)) {
      throw new Error(
        `fail requires --classification with one of: ${[...FAILURE_CLASSIFICATIONS].join(", ")}.`,
      );
    }
    const failedAt = new Date().toISOString();
    const failure = {
      classification: options.classification,
      reason: options.reason,
      evidence: options.evidence,
      source_state: options.sourceState,
      failed_at: failedAt,
    };
    const record = state.tasks[ref];
    const attempts = record.attempts ?? [];
    const attempt = attempts.at(-1);
    attempt.failed_at = failedAt;
    attempt.failure = failure;
    state.tasks[ref] = {
      ...record,
      status: "failed",
      failed_at: failedAt,
      last_failure: failure,
    };
    state.active_task = null;
    state.approved_transition = null;
    appendEvent(state, "task_failed", {
      task_ref: ref,
      evidence: options.evidence,
      source_state: options.sourceState,
      details: { attempt: attempt.number, failure },
    });
    return {
      result: {
        failed: true,
        blocked: true,
        task: ref,
        attempt: attempt.number,
        failure,
        next_action:
          "Resolve the blocker, then use retry with explicit owner/evidence fields; do not advance.",
      },
      changed: true,
    };
  }

  throw new Error(
    `Unknown command: ${command}. Use next, status, approve-plan, authorize-run, approve, start, complete, fail, or retry.`,
  );
}

export function runTaskCommand(argv, cwd = process.cwd()) {
  const options = parseArguments(argv);
  if (!options.command) {
    throw new Error(
      "Usage: local-task-runner <next|status|approve-plan|authorize-run|approve|start|complete|fail|retry> [ref] [reason] [--actor value] [--evidence value] [--fingerprint value] [--source-state value] [--classification value] [--checks ids] [--plan path] [--state path] [--json]",
    );
  }
  if (!ALL_COMMANDS.has(options.command)) {
    throw new Error(
      `Unknown command: ${options.command}. Use next, status, approve-plan, authorize-run, approve, start, complete, fail, or retry.`,
    );
  }

  options.planPath = path.resolve(cwd, options.planPath);
  options.statePath = path.resolve(cwd, options.statePath);

  const plan = readJson(options.planPath);
  validatePlan(plan);
  const prdPath = path.resolve(path.dirname(options.planPath), plan.plan.prd);
  if (!fs.existsSync(prdPath) || !fs.statSync(prdPath).isFile()) {
    throw new Error(`Plan PRD file not found: ${prdPath}`);
  }
  const planFingerprint = fingerprintPlan(plan);

  const execute = () => {
    const state = readJson(
      options.statePath,
      initialState(plan, planFingerprint),
    );
    validateState(state, plan, planFingerprint);
    const execution = applyCommand(options, plan, state);
    if (execution.changed) {
      state.revision += 1;
      writeJsonAtomic(options.statePath, state);
      execution.result.state_revision = state.revision;
    }
    return { output: execution.result, json: options.json };
  };

  return MUTATING_COMMANDS.has(options.command)
    ? withStateLock(options.statePath, execute)
    : execute();
}

function printResult(value, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  try {
    const execution = runTaskCommand(process.argv.slice(2));
    printResult(execution.output, execution.json);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href
) {
  main();
}
