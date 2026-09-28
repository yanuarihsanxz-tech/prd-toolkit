import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runTaskCommand } from "../scripts/local-task-runner.mjs";

const SOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;

function verification() {
  return [
    {
      id: "VER-001",
      method: "test",
      environment: "temporary local fixture",
      procedure: "Run the focused fixture assertions.",
      expected_result: "The task-specific success and failure assertions pass.",
      evidence_required: "Exit result and source fingerprint.",
      timeout_seconds: 30,
      cleanup: "Remove the temporary fixture after the test.",
    },
  ];
}

function authority(overrides = {}) {
  return {
    execution_mode: "local_test",
    allowed_side_effects: ["write task-owned temporary fixture files"],
    forbidden_side_effects: [
      "network access",
      "production changes",
      "external notifications",
    ],
    requires_owner_authorization: false,
    ...overrides,
  };
}

function task(overrides) {
  return {
    ref: "FE-001",
    title: "First frontend task",
    objective: "Deliver one independently verifiable outcome.",
    layer: "frontend",
    phase: 1,
    phase_total: 2,
    page: "home",
    requirement_ids: ["FR-001"],
    acceptance_criteria_ids: ["AC-001"],
    depends_on: [],
    allowed_paths: ["src/frontend/**", "tests/frontend/**"],
    forbidden_paths: ["src/backend/**", ".env*"],
    verification: verification(),
    authority: authority(),
    max_attempts: 2,
    ...overrides,
  };
}

function createPlan() {
  return {
    schema_version: 2,
    plan: {
      id: "test-plan-v2",
      title: "Test plan v2",
      prd: "PRD.md",
      prd_version: "0.1.0",
      source_fingerprint: SOURCE_FINGERPRINT,
      generated_at: "2026-08-28T14:55:00Z",
    },
    tasks: [
      task({ ref: "FE-001" }),
      task({
        ref: "FE-002",
        title: "Second frontend task",
        requirement_ids: ["FR-002"],
        acceptance_criteria_ids: ["AC-002"],
        depends_on: ["FE-001"],
      }),
      task({
        ref: "BE-001",
        title: "Backend task",
        layer: "backend",
        phase: 2,
        page: null,
        requirement_ids: ["FR-003", "NFR-001"],
        acceptance_criteria_ids: ["AC-003"],
        depends_on: ["FE-002"],
        allowed_paths: ["src/backend/**", "tests/backend/**"],
        forbidden_paths: ["src/frontend/**", ".env*"],
      }),
    ],
  };
}

function createFixture(t, mutatePlan) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-task-runner-v2-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const plan = createPlan();
  if (mutatePlan) mutatePlan(plan);
  fs.writeFileSync(path.join(directory, "PRD.md"), "# Test PRD\n");
  fs.writeFileSync(
    path.join(directory, "TASKS.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  return directory;
}

function run(directory, ...arguments_) {
  return runTaskCommand(
    [
      ...arguments_,
      "--plan",
      "TASKS.json",
      "--state",
      ".prd/task-state.json",
      "--json",
    ],
    directory,
  ).output;
}

function approvePlan(directory) {
  return run(
    directory,
    "approve-plan",
    "--actor",
    "Owner",
    "--evidence",
    "Owner approved the exact plan fingerprint in the local test.",
  );
}

function authorizeRun(directory, throughRef, fingerprint) {
  return run(
    directory,
    "authorize-run",
    throughRef,
    "--actor",
    "Owner",
    "--fingerprint",
    fingerprint,
    "--evidence",
    `Owner authorized the exact approved plan from the current candidate through ${throughRef}.`,
  );
}

function start(directory, ref, sourceState = "git:test-start") {
  return run(
    directory,
    "start",
    ref,
    "--source-state",
    sourceState,
    "--evidence",
    `Preflight passed for ${ref}.`,
  );
}

function complete(directory, ref, sourceState = "git:test-complete") {
  return run(
    directory,
    "complete",
    ref,
    "--source-state",
    sourceState,
    "--evidence",
    `VER-001 passed for ${ref}.`,
    "--checks",
    "VER-001",
  );
}

function fail(directory, ref, reason = "Local dependency is unavailable.") {
  return run(
    directory,
    "fail",
    ref,
    reason,
    "--classification",
    "ENVIRONMENT_BLOCKED",
    "--source-state",
    "git:test-failed",
    "--evidence",
    "Focused diagnostics reproduced the local dependency blocker.",
  );
}

test("customized v2 template passes runner semantic validation", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prd-task-template-v2-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const template = JSON.parse(
    fs.readFileSync(new URL("../templates/task-plan.json", import.meta.url), "utf8"),
  );
  assert.ok(template.tasks.length >= 1 && template.tasks.length <= 5);
  assert.equal(template.tasks.at(-1).layer, "qualification");
  assert.equal(template.tasks.at(-1).authority.requires_owner_authorization, false);
  assert.ok(template.tasks.at(-1).allowed_paths.includes("IMPLEMENTATION_AUDIT.md"), "The final task must be authorized to write its required audit artifact");
  assert.ok(template.tasks.some((entry) => entry.layer === "vertical_slice"));
  template.plan.id = "customized-template-plan";
  template.plan.source_fingerprint = SOURCE_FINGERPRINT;
  template.plan.generated_at = "2026-08-28T14:55:00Z";
  fs.writeFileSync(path.join(directory, "PRD.md"), "# Template PRD\n");
  fs.writeFileSync(
    path.join(directory, "TASKS.json"),
    `${JSON.stringify(template, null, 2)}\n`,
  );

  const next = run(directory, "next");
  assert.equal(next.block.type, "plan_approval_required");
  assert.equal(next.candidate.ref, "PRODUCT-P1-001");
  const approval = approvePlan(directory);
  const authorization = authorizeRun(
    directory,
    "AUDIT-P3-001",
    approval.approval.plan_fingerprint,
  );
  assert.deepEqual(authorization.authorization.task_refs, [
    "PRODUCT-P1-001",
    "SYSTEM-P2-001",
    "AUDIT-P3-001",
  ]);
});

test("one plan approval covers ordinary local milestone transitions", (t) => {
  const directory = createFixture(t);

  const unapproved = run(directory, "next");
  assert.equal(unapproved.done, false);
  assert.equal(unapproved.blocked, true);
  assert.equal(unapproved.block.type, "plan_approval_required");
  assert.equal(unapproved.candidate.ref, "FE-001");
  assert.throws(() => start(directory, "FE-001"), /Plan approval required/);

  const planApproval = approvePlan(directory);
  assert.equal(planApproval.approved, true);
  assert.equal(planApproval.approval.approved_by, "Owner");
  assert.match(planApproval.approval.plan_fingerprint, /^sha256:/);

  const first = run(directory, "next");
  assert.equal(first.task.ref, "FE-001");
  assert.equal(first.checkpoint.required, false);
  start(directory, "FE-001");
  complete(directory, "FE-001");

  const second = run(directory, "next");
  assert.equal(second.task.ref, "FE-002");
  assert.equal(second.checkpoint.required, false);
  start(directory, "FE-002");
  complete(directory, "FE-002");

  const backend = run(directory, "next");
  assert.equal(backend.task.ref, "BE-001");
  assert.equal(backend.checkpoint.required, false);
  assert.deepEqual(backend.checkpoint.reasons, []);
  start(directory, "BE-001");
  complete(directory, "BE-001");

  const final = run(directory, "next");
  assert.equal(final.done, true);
  assert.equal(final.blocked, false);
  assert.equal(final.summary.completed, 3);
  assert.equal(final.summary.failed, 0);

  const state = JSON.parse(
    fs.readFileSync(path.join(directory, ".prd/task-state.json"), "utf8"),
  );
  assert.equal(state.schema_version, 2);
  assert.equal(state.plan_approval.approved_by, "Owner");
  assert.equal(state.tasks["BE-001"].attempts[0].transition_approval, null);
  assert.deepEqual(
    state.event_log.map((event) => event.sequence),
    Array.from({ length: state.event_log.length }, (_, index) => index + 1),
  );
  assert.equal(fs.statSync(path.join(directory, ".prd/task-state.json")).mode & 0o777, 0o600);
});

test("a layer label change inside one phase is informational, not an approval gate", (t) => {
  const directory = createFixture(t, (plan) => {
    plan.plan.id = "same-phase-cross-layer-plan";
    plan.tasks = [
      task({ ref: "SLICE-001", layer: "frontend", phase: 1, phase_total: 1 }),
      task({
        ref: "SLICE-002",
        title: "Finish the same delivery slice through the backend contract",
        layer: "backend",
        phase: 1,
        phase_total: 1,
        page: null,
        requirement_ids: ["FR-002"],
        acceptance_criteria_ids: ["AC-002"],
        depends_on: ["SLICE-001"],
        allowed_paths: ["src/backend/**", "tests/backend/**"],
        forbidden_paths: [".env*", "production/**"],
      }),
    ];
  });
  approvePlan(directory);
  start(directory, "SLICE-001");
  complete(directory, "SLICE-001");

  const next = run(directory, "next");
  assert.equal(next.task.ref, "SLICE-002");
  assert.equal(next.checkpoint.required, false);
  assert.deepEqual(next.checkpoint.reasons, []);
  assert.equal(start(directory, "SLICE-002").started, true);
});

test("bounded run authorization satisfies a declared authority gate", (t) => {
  const directory = createFixture(t, (plan) => {
    plan.tasks[2].authority = authority({
      execution_mode: "staging",
      requires_owner_authorization: true,
    });
  });
  const planApproval = approvePlan(directory);
  start(directory, "FE-001");
  complete(directory, "FE-001");
  start(directory, "FE-002");
  complete(directory, "FE-002");

  const before = run(directory, "next");
  assert.equal(before.task.ref, "BE-001");
  assert.equal(before.checkpoint.required, true);
  assert.deepEqual(before.checkpoint.reasons, ["owner_authorization_required"]);

  const authorization = authorizeRun(
    directory,
    "BE-001",
    planApproval.approval.plan_fingerprint,
  );
  assert.equal(authorization.authorized, true);
  assert.equal(authorization.authorization.from_task_ref, "BE-001");
  assert.equal(authorization.authorization.through_task_ref, "BE-001");
  assert.deepEqual(authorization.authorization.execution_modes, ["staging"]);

  const after = run(directory, "next");
  assert.equal(after.checkpoint.required, false);
  assert.equal(after.checkpoint.approval, null);
  assert.equal(after.checkpoint.run_authorization.through_task_ref, "BE-001");
  start(directory, "BE-001");
  complete(directory, "BE-001");

  const state = JSON.parse(
    fs.readFileSync(path.join(directory, ".prd/task-state.json"), "utf8"),
  );
  assert.equal(state.run_authorization.authorized_by, "Owner");
  assert.equal(
    state.tasks["BE-001"].attempts[0].run_authorization.plan_fingerprint,
    planApproval.approval.plan_fingerprint,
  );
  assert.ok(
    state.event_log.some((event) => event.type === "run_authorized"),
  );
});

test("bounded run authorization stops after its through task", (t) => {
  const directory = createFixture(t, (plan) => {
    plan.tasks[2].authority = authority({
      execution_mode: "staging",
      requires_owner_authorization: true,
    });
  });
  const approval = approvePlan(directory);
  authorizeRun(directory, "FE-002", approval.approval.plan_fingerprint);
  start(directory, "FE-001");
  complete(directory, "FE-001");
  start(directory, "FE-002");
  complete(directory, "FE-002");

  const backend = run(directory, "next");
  assert.equal(backend.task.ref, "BE-001");
  assert.equal(backend.checkpoint.required, true);
  assert.deepEqual(backend.checkpoint.reasons, ["owner_authorization_required"]);
  assert.equal(backend.checkpoint.run_authorization, null);
  assert.throws(() => start(directory, "BE-001"), /Checkpoint approval required/);
});

test("run authorization requires the exact fingerprint and refuses production coverage", (t) => {
  const wrongFingerprint = createFixture(t);
  approvePlan(wrongFingerprint);
  assert.throws(
    () => authorizeRun(wrongFingerprint, "BE-001", `sha256:${"b".repeat(64)}`),
    /fingerprint mismatch/,
  );

  const production = createFixture(t, (plan) => {
    plan.plan.id = "production-authorization-plan";
    plan.tasks[2].authority = authority({
      execution_mode: "production",
      requires_owner_authorization: true,
    });
  });
  const approval = approvePlan(production);
  assert.throws(
    () => authorizeRun(production, "BE-001", approval.approval.plan_fingerprint),
    /cannot cover production tasks: BE-001/,
  );
});

test("failed task blocks next, status, and all later task execution", (t) => {
  const directory = createFixture(t);
  approvePlan(directory);
  start(directory, "FE-001");
  complete(directory, "FE-001");
  start(directory, "FE-002");
  fail(directory, "FE-002");

  const next = run(directory, "next");
  assert.equal(next.done, false);
  assert.equal(next.blocked, true);
  assert.equal(next.block.type, "failed_task");
  assert.equal(next.block.task_ref, "FE-002");
  assert.equal(next.block.classification, "ENVIRONMENT_BLOCKED");
  assert.throws(
    () => start(directory, "BE-001"),
    /Plan blocked by failed task FE-002/,
  );

  const status = run(directory, "status");
  assert.equal(status.summary.completed, 1);
  assert.equal(status.summary.failed, 1);
  assert.equal(status.summary.blocked_by, "FE-002");
  assert.equal(status.summary.last_completed.ref, "FE-001");
  assert.equal(status.block.task_ref, "FE-002");
});

test("retry requires evidence and preserves the failed attempt", (t) => {
  const directory = createFixture(t);
  approvePlan(directory);
  start(directory, "FE-001");
  complete(directory, "FE-001");
  start(directory, "FE-002", "git:attempt-one");
  fail(directory, "FE-002");

  assert.throws(
    () => run(directory, "retry", "FE-002"),
    /retry requires --actor/,
  );
  const retry = run(
    directory,
    "retry",
    "FE-002",
    "--actor",
    "Owner",
    "--source-state",
    "git:blocker-resolved",
    "--evidence",
    "Owner confirmed the local dependency is available and authorized retry.",
  );
  assert.equal(retry.retry_authorized, true);
  assert.equal(run(directory, "next").task.ref, "FE-002");

  start(directory, "FE-002", "git:attempt-two");
  complete(directory, "FE-002", "git:attempt-two-verified");
  assert.equal(run(directory, "next").task.ref, "BE-001");

  const state = JSON.parse(
    fs.readFileSync(path.join(directory, ".prd/task-state.json"), "utf8"),
  );
  assert.equal(state.tasks["FE-002"].attempts.length, 2);
  assert.equal(
    state.tasks["FE-002"].attempts[0].failure.classification,
    "ENVIRONMENT_BLOCKED",
  );
  assert.equal(state.tasks["FE-002"].attempts[1].completion.verified_checks[0], "VER-001");
  assert.match(
    state.tasks["FE-002"].attempts[1].retry_authorization.evidence,
    /authorized retry/,
  );
});

test("max_attempts prevents repeated retry and advancement", (t) => {
  const directory = createFixture(t, (plan) => {
    plan.tasks[0].max_attempts = 1;
  });
  approvePlan(directory);
  start(directory, "FE-001");
  fail(directory, "FE-001");

  assert.throws(
    () =>
      run(
        directory,
        "retry",
        "FE-001",
        "--actor",
        "Owner",
        "--source-state",
        "git:resolved",
        "--evidence",
        "Retry requested after resolution.",
      ),
    /exhausted max_attempts \(1\)/,
  );
  assert.equal(run(directory, "next").block.task_ref, "FE-001");
});

test("plan mutation invalidates stored approval without rewriting state", (t) => {
  const directory = createFixture(t);
  const approval = approvePlan(directory);
  const statePath = path.join(directory, ".prd/task-state.json");
  const before = fs.readFileSync(statePath, "utf8");
  const planPath = path.join(directory, "TASKS.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  plan.tasks[0].title = "Mutated after approval";
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);

  assert.throws(() => run(directory, "status"), /PLAN_CHANGED/);
  assert.equal(fs.readFileSync(statePath, "utf8"), before);
  assert.match(approval.approval.plan_fingerprint, /^sha256:/);
});

test("rejects out-of-order tasks and incomplete dependencies", (t) => {
  const directory = createFixture(t);
  approvePlan(directory);
  assert.throws(
    () => start(directory, "FE-002"),
    /refusing out-of-order task FE-002/,
  );
});

test("requires preflight and complete verification evidence", (t) => {
  const directory = createFixture(t);
  approvePlan(directory);
  assert.throws(
    () => run(directory, "start", "FE-001"),
    /start requires secret-free --evidence/,
  );
  assert.throws(
    () =>
      run(
        directory,
        "start",
        "FE-001",
        "--source-state",
        "UNVERIFIED",
        "--evidence",
        "Preflight ran without an exact fingerprint.",
      ),
    /must be an exact git:/,
  );
  start(directory, "FE-001");
  assert.throws(
    () =>
      run(
        directory,
        "complete",
        "FE-001",
        "--source-state",
        "git:verified",
        "--evidence",
        "Focused checks passed.",
      ),
    /complete requires --checks/,
  );
  assert.throws(
    () =>
      run(
        directory,
        "complete",
        "FE-001",
        "--source-state",
        "git:verified",
        "--evidence",
        "Focused checks passed.",
        "--checks",
        "VER-999",
      ),
    /must equal VER-001/,
  );
  complete(directory, "FE-001");
});

test("owner-authorized task cannot start before its explicit task approval", (t) => {
  const directory = createFixture(t, (plan) => {
    plan.tasks[0].authority = authority({
      execution_mode: "staging",
      requires_owner_authorization: true,
    });
  });
  approvePlan(directory);

  const next = run(directory, "next");
  assert.deepEqual(next.checkpoint.reasons, ["owner_authorization_required"]);
  assert.throws(
    () => start(directory, "FE-001"),
    /Checkpoint approval required/,
  );
  run(
    directory,
    "approve",
    "FE-001",
    "--actor",
    "Owner",
    "--evidence",
    "Owner approved the declared staging side-effect envelope.",
  );
  assert.equal(start(directory, "FE-001").started, true);
});

test("rejects v1, malformed requirement IDs, future dependencies, and unsafe production authority", (t) => {
  const v1 = createFixture(t, (plan) => {
    plan.schema_version = 1;
  });
  assert.throws(() => run(v1, "next"), /must use schema_version 2/);

  const malformed = createFixture(t, (plan) => {
    plan.plan.id = "malformed-plan";
    plan.tasks[0].requirement_ids = ["R1"];
  });
  assert.throws(() => run(malformed, "next"), /requirement_ids\[0\] has invalid format/);

  const futureDependency = createFixture(t, (plan) => {
    plan.plan.id = "future-dependency-plan";
    plan.tasks[0].depends_on = ["FE-002"];
  });
  assert.throws(() => run(futureDependency, "next"), /must reference an earlier task/);

  const unsafeProduction = createFixture(t, (plan) => {
    plan.plan.id = "unsafe-production-plan";
    plan.tasks[0].authority = authority({
      execution_mode: "production",
      requires_owner_authorization: false,
    });
  });
  assert.throws(
    () => run(unsafeProduction, "next"),
    /production mode requires explicit owner authorization/,
  );

  const escapedScope = createFixture(t, (plan) => {
    plan.plan.id = "escaped-scope-plan";
    plan.tasks[0].allowed_paths = ["../outside-project/**"];
  });
  assert.throws(
    () => run(escapedScope, "next"),
    /must remain inside the target project/,
  );

  const missingPrd = createFixture(t, (plan) => {
    plan.plan.id = "missing-prd-plan";
    plan.plan.prd = "MISSING.md";
  });
  assert.throws(() => run(missingPrd, "next"), /Plan PRD file not found/);
});

test("state lock prevents concurrent mutation without blocking read-only status", (t) => {
  const directory = createFixture(t);
  approvePlan(directory);
  const lockPath = path.join(directory, ".prd/task-state.json.lock");
  fs.writeFileSync(lockPath, '{"pid":999999,"created_at":"2026-08-28T00:00:00Z"}\n');
  t.after(() => {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  });

  assert.equal(run(directory, "status").summary.completed, 0);
  assert.throws(() => start(directory, "FE-001"), /State lock exists/);
});
