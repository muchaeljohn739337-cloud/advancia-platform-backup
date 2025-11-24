# Automated regional chaining guide

You've built something serious—deployments that don't just ship, they adapt. This guide shows how to chain multi‑region rollouts (US → EU → APAC) with canary stages, automated monitoring, and isolated rollbacks. It includes configuration examples, troubleshooting scenarios, and hard‑won best practices.

---

## Setup and configuration

### Environments and secrets

-   **Regions:** Create GitHub Environments for each region.
    -   `production-us`, `production-eu`, `production-apac`
-   **Scoped secrets:** Store region‑specific credentials within each environment.
    -   `CF_API_TOKEN`, `CF_ZONE_ID`, `SLACK_WEBHOOK_URL`, etc.
-   **Shared repository secrets:** Use for cross‑region items that aren't sensitive per environment.
    -   `DATADOG_API_KEY`, `GRAFANA_URL`, common webhook URLs if appropriate

### Workflow inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      rollout_style:
        description: "Choose rollout style: parallel or delayed"
        required: true
        default: "parallel"
        type: choice
        options: [parallel, delayed]
      delay_minutes:
        description: "Delay between regions (only for delayed)"
        required: false
        default: "120"
        type: number
      error_threshold:
        description: "Max acceptable error rate (%)"
        required: false
        default: "5"
        type: number
      latency_threshold_ms:
        description: "Max acceptable latency (ms)"
        required: false
        default: "300"
        type: number
```

### Pipeline scripts (suggested)

-   **deploy.sh:** Builds and deploys to Blue/Green in a target region.
-   **canary_rollout.sh:** Progressively shifts traffic (10 → 25 → 50 → 75 → 100) in a region.
-   **check_metrics.sh:** Validates thresholds using your metrics backend.
-   **rollback.sh:** Routes traffic back to Blue for a target region.
-   **notify.sh:** Posts status updates to Slack with region and stage metadata.

> Tip: Keep scripts idempotent so re‑runs are safe, and include verbose logging for auditability.

---

## Orchestration patterns and examples

### Cascading regional chaining (US → EU → APAC)

```yaml
jobs:
  deploy-us:
    runs-on: ubuntu-latest
    environment: production-us
    steps:
      - name: Deploy to US Green
        run: ./scripts/deploy.sh --region us
      - name: US canary rollout
        run: ./scripts/canary_rollout.sh --region us
      - name: Monitor US
        run: ./scripts/check_metrics.sh --region us \
          --error-threshold ${{ github.event.inputs.error_threshold }} \
          --latency-threshold ${{ github.event.inputs.latency_threshold_ms }}

  deploy-eu:
    runs-on: ubuntu-latest
    environment: production-eu
    needs: deploy-us
    if: success() && ${{ github.event.inputs.rollout_style == 'delayed' }}
    steps:
      - name: Delay before EU rollout
        run: sleep $(( ${{ github.event.inputs.delay_minutes }} * 60 ))
      - name: Deploy to EU Green
        run: ./scripts/deploy.sh --region eu
      - name: EU canary rollout
        run: ./scripts/canary_rollout.sh --region eu
      - name: Monitor EU
        run: ./scripts/check_metrics.sh --region eu \
          --error-threshold ${{ github.event.inputs.error_threshold }} \
          --latency-threshold ${{ github.event.inputs.latency_threshold_ms }}

  deploy-eu-parallel:
    runs-on: ubuntu-latest
    environment: production-eu
    if: ${{ github.event.inputs.rollout_style == 'parallel' }}
    steps:
      - name: Deploy + rollout EU (parallel)
        run: |
          ./scripts/deploy.sh --region eu
          ./scripts/canary_rollout.sh --region eu
          ./scripts/check_metrics.sh --region eu \
            --error-threshold ${{ github.event.inputs.error_threshold }} \
            --latency-threshold ${{ github.event.inputs.latency_threshold_ms }}

  deploy-apac:
    runs-on: ubuntu-latest
    environment: production-apac
    needs: [deploy-eu, deploy-eu-parallel]
    steps:
      - name: Deploy to APAC Green
        run: ./scripts/deploy.sh --region apac
      - name: APAC canary rollout
        run: ./scripts/canary_rollout.sh --region apac
      - name: Monitor APAC
        run: ./scripts/check_metrics.sh --region apac \
          --error-threshold ${{ github.event.inputs.error_threshold }} \
          --latency-threshold ${{ github.event.inputs.latency_threshold_ms }}
```

### Region‑isolated rollback jobs

```yaml
rollback-us:
  runs-on: ubuntu-latest
  if: failure() && needs.deploy-us.result == 'failure'
  steps:
    - name: Rollback US to Blue
      run: ./scripts/rollback.sh --region us

rollback-eu:
  runs-on: ubuntu-latest
  if: failure() && (needs.deploy-eu.result == 'failure' || needs.deploy-eu-parallel.result == 'failure')
  steps:
    - name: Rollback EU to Blue
      run: ./scripts/rollback.sh --region eu

rollback-apac:
  runs-on: ubuntu-latest
  if: failure() && needs.deploy-apac.result == 'failure'
  steps:
    - name: Rollback APAC to Blue
      run: ./scripts/rollback.sh --region apac
```

### Slack notifications with dashboard links

```yaml
- name: Notify Slack
  if: always()
  run: |
    REGION="${REGION:-us}"
    STYLE="${{ github.event.inputs.rollout_style }}"
    STATUS="✅ ${REGION^^} rollout ${STYLE} stage passed"
    if [ "${{ job.status }}" = "failure" ]; then
      STATUS="⚠️ ${REGION^^} rollout failed — rolled back to Blue"
    fi
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$STATUS\nGrafana: $GRAFANA_URL/d/${REGION}-canary\"}" \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Monitoring, thresholds, and rollback

### Metric checks (example script)

```bash
#!/usr/bin/env bash
set -euo pipefail

REGION="${1:-us}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}"
LATENCY_THRESHOLD="${LATENCY_THRESHOLD:-300}"

# Replace with your metrics source: Prometheus, Datadog, internal API, etc.
METRICS_JSON="$(curl -s "https://$REGION.example.com/metrics")"

ERROR_RATE="$(echo "$METRICS_JSON" | jq '.error_rate')"
LATENCY_MS="$(echo "$METRICS_JSON" | jq '.avg_latency_ms')"
CPU="$(echo "$METRICS_JSON" | jq '.cpu_usage')"
MEM="$(echo "$METRICS_JSON" | jq '.mem_usage')"

echo "Region: $REGION"
echo "Error rate: $ERROR_RATE% (threshold: $ERROR_THRESHOLD%)"
echo "Latency: $LATENCY_MS ms (threshold: $LATENCY_THRESHOLD ms)"
echo "CPU: $CPU% | Memory: $MEM%"

if (( $(printf "%.0f" "$ERROR_RATE") > ERROR_THRESHOLD )) \
   || (( $(printf "%.0f" "$LATENCY_MS") > LATENCY_THRESHOLD )) \
   || (( $(printf "%.0f" "$CPU") > 80 )) \
   || (( $(printf "%.0f" "$MEM") > 80 )); then
  echo "Canary failed thresholds — triggering rollback."
  exit 1
fi

echo "Canary thresholds OK."
```

### Canary percentages and flag sync

-   **Traffic percentages:** 10 → 25 → 50 → 75 → 100
-   **Feature flags:** Match traffic exposure per stage, disable on rollback
-   **Gate per stage:** Validate metrics at each percentage before advancing

### Rollback behavior

-   **Isolation:** Only the failing region routes back to Blue.
-   **Stop chain:** Downstream regions do not start after a failure.
-   **Alerts:** Post rollback reason, metrics snapshot, and next steps to Slack.

---

## Troubleshooting scenarios

-   **Symptom:** EU job didn't start after US passed.
    -   **Cause:** Using delayed mode without delay input or `needs:` misconfigured.
    -   **Fix:** Ensure `needs: deploy-us` is set for EU, and input `rollout_style=delayed`.

-   **Symptom:** APAC starts before EU finishes.
    -   **Cause:** Parallel mode enabled; APAC `needs:` not set to both EU jobs.
    -   **Fix:** Use `needs: [deploy-eu, deploy-eu-parallel]` to gate APAC in both styles.

-   **Symptom:** Rollback doesn't trigger on canary failure.
    -   **Cause:** `if: failure()` guard not matched to the right job's result.
    -   **Fix:** Scope conditions to specific job results (e.g., `needs.deploy-eu.result == 'failure'`).

-   **Symptom:** Metrics script exits with parsing errors.
    -   **Cause:** Missing `jq` or metrics endpoint inconsistency.
    -   **Fix:** Install `jq` in the job and validate JSON structure; add retries and timeouts.

-   **Symptom:** Slack shows "success" after a rollback.
    -   **Cause:** Notification step not using `if: always()` or it runs before failure is detected.
    -   **Fix:** Use `if: always()` and check `${{ job.status }}` inside the notification step.

-   **Symptom:** Canary traffic weights aren't applied.
    -   **Cause:** DNS provider or LB doesn't support weighted routing as configured.
    -   **Fix:** Use a load balancer or traffic manager that supports weighted routing; test with a staging domain first.

---

## Best practices and checklist

-   **Clear ownership:** Define who approves and who responds to rollbacks per region.
-   **Small blast radius:** Start in your most resilient region; keep early stages short.
-   **Immutable artifacts:** Build once, deploy the same artifact to every region.
-   **Idempotent scripts:** Safe to re‑run; include retries with exponential backoff.
-   **Observability first:** Treat metrics, logs, and traces as part of the release.
-   **SLO‑aligned thresholds:** Set error/latency thresholds to reflect real SLOs, not guesses.
-   **Feature flag hygiene:** Default flags off; ramp exposure in lockstep with canary traffic.
-   **Chaos drills:** Occasionally simulate failures to validate rollback and alerting paths.
-   **Post‑deploy review:** Capture metrics snapshots and decisions; improve thresholds over time.
-   **Security:** Scope secrets per environment; least privilege for API tokens and infra access.

### Final checklist

-   **Environments:** production-us, production-eu, production-apac created
-   **Secrets:** Region‑scoped and verified
-   **Inputs:** Rollout style, delay, thresholds parameterized
-   **Scripts:** Deploy, canary, monitor, rollback, notify implemented
-   **Routing:** Weighted traffic supported and tested
-   **Dashboards:** Region views with alerts wired to Slack/Teams
-   **Approvals:** Gates configured where needed (UAT/production)
-   **Runbook:** Troubleshooting steps documented and accessible
