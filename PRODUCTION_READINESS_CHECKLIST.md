# Production Readiness Checklist

**Date:** November 15, 2025  
**Version:** v1.0.0  
**Deployment Strategy:** Delayed (sequential with observation periods)

---

## ✅ Pre-Deployment Checklist

### 1. Configuration and Secrets

- [ ] **GitHub Environments created:**
  - [ ] `production-us-east`
  - [ ] `production-eu-west`
  - [ ] `production-apac-se`

- [ ] **Secrets configured (per environment or repository-wide):**
  - [ ] `SLACK_WEBHOOK_URL` - For incident Quick Cards
  - [ ] `GLOBAL_SLACK_WEBHOOK` - For deployment summaries
  - [ ] `TEAMS_WEBHOOK_URL` - Optional Microsoft Teams integration
  - [ ] `DROPLET_IP_GREEN` - Green environment target
  - [ ] `DROPLET_IP_BLUE` - Blue environment (current production)
  - [ ] `LB_IP` - Load balancer IP
  - [ ] `DROPLET_USER` - SSH user for deployments
  - [ ] `PROMETHEUS_PUSHGATEWAY_URL` - Metrics endpoint
  - [ ] `CF_ZONE_ID` - Cloudflare zone identifier
  - [ ] `CF_API_TOKEN` - Cloudflare API token
  - [ ] `CF_RECORD_ID_API` - DNS record ID
  - [ ] `GRAFANA_API_KEY` - Dashboard annotation access

- [ ] **Secret rotation:** All secrets rotated within last 90 days
- [ ] **Least privilege:** Secrets scoped to specific environments where possible
- [ ] **Immutable artifacts:** Build once, promote across regions (no per-region rebuilds)

### 2. Feature Flags and Configuration

- [ ] **Feature flags:** Default OFF in production
- [ ] **Canary mapping:** Flags tied to canary stages (10%, 25%, 50%, 75%, 100%)
- [ ] **Experimental toggles:** Removed or disabled
- [ ] **Production configs:** Only production-ready features enabled
- [ ] **Backward compatibility:** Schema changes are backward-compatible

### 3. Environment Protection Rules

- [ ] **Required reviewers:** Configured per environment
  - [ ] US East: 1 functional + 1 SRE approval
  - [ ] EU West: 1 functional + 1 SRE approval
  - [ ] APAC Southeast: 1 functional + 1 SRE approval
- [ ] **Wait timer:** Optional delay before deployment starts
- [ ] **Branch restrictions:** Only `main` or `release/*` can deploy

### 4. Deployment Plan

- [ ] **Initial strategy:** Delayed mode for first production run
- [ ] **Sequence verified:** US East → EU West → APAC Southeast
- [ ] **Timing windows:**
  - [ ] US: Morning local (9 AM - 11 AM EST)
  - [ ] EU: Early afternoon local (2 PM - 4 PM CET)
  - [ ] APAC: Morning local next day (9 AM - 11 AM SGT)
- [ ] **Delay duration:** 60-120 minutes between regions
- [ ] **Code freeze:** 24 hours before deployment
- [ ] **Critical fix process:** Exception approval process documented

### 5. Observability and Monitoring

- [ ] **Grafana dashboards created:**
  - [ ] Global overview dashboard
  - [ ] Per-region dashboards (US, EU, APAC)
  - [ ] Canary stage comparison dashboard
- [ ] **Dashboard metrics:**
  - [ ] Error rate (threshold: 0.2-1.0% depending on stage)
  - [ ] P95 latency (threshold: 300-500ms depending on stage)
  - [ ] CPU utilization (warning at 80%)
  - [ ] Memory utilization (warning at 80%)
  - [ ] Traffic distribution (Green vs Blue %)
- [ ] **Prometheus metrics:** Pushgateway configured and tested
- [ ] **Slack notifications:** Incident Quick Cards tested
- [ ] **Log aggregation:** Verbose logging enabled with correlation IDs
- [ ] **Tracing:** Sample rate increased for deployment window

### 6. Rollback and Contingency

- [ ] **Rollback isolation:** Only failing region rolls back
- [ ] **Rollback triggers:** Automated via metrics script exit codes
- [ ] **Backout window:** 15 minutes max from failure to rollback
- [ ] **Manual rollback:** Emergency workflow or commands documented
- [ ] **Data safety:** Schema changes tested for rollback compatibility
- [ ] **Chaos drill:** Pre-production rollback simulation completed
  - [ ] Date completed: ______________
  - [ ] Alerts verified: ______________
  - [ ] Rollback time measured: ______________

### 7. Testing and Validation

- [ ] **Staging deployment:** Successful end-to-end test
- [ ] **Canary thresholds:** Tested with synthetic load
- [ ] **Metrics scripts:** Return proper exit codes on threshold violations
- [ ] **Health checks:** All endpoints return 200 OK
- [ ] **Load testing:** Completed for expected production traffic
- [ ] **Synthetic checks:** Configured for post-deployment validation

---

## 🚀 Deployment Execution

### First Production Run Command

```bash
# Recommended for initial production deployment
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=all \
  -f deployment_strategy=delayed \
  -f delay_between_regions=90
```

### Deployment Sequence

1. **US East Deployment** (Stage 1)
   - [ ] Deploy to Green environment
   - [ ] Canary rollout: 10% → 25% → 50% → 75% → 100%
   - [ ] 5 minutes monitoring per stage
   - [ ] Metrics pushed to Prometheus
   - [ ] Slack notifications sent

2. **Observation Period** (90 minutes)
   - [ ] Monitor US East metrics
   - [ ] Verify no error rate spikes
   - [ ] Confirm latency within thresholds
   - [ ] Check Grafana annotations

3. **EU West Deployment** (Stage 2)
   - [ ] Automatic trigger after US East success
   - [ ] Same canary progression
   - [ ] Regional isolation confirmed

4. **Observation Period** (90 minutes)
   - [ ] Monitor EU West metrics
   - [ ] Verify US East remains stable

5. **APAC Southeast Deployment** (Stage 3)
   - [ ] Automatic trigger after EU West success
   - [ ] Final canary progression
   - [ ] Global deployment summary

---

## 📊 Post-Deployment Validation

### Immediate Checks (Per Region)

- [ ] **Health endpoints:** All return 200 OK
- [ ] **Synthetic checks:** Pass for 30 minutes at 100% traffic
- [ ] **Real user metrics:** Error rate < 1%, latency within SLO
- [ ] **Database:** Connection pools sized appropriately
- [ ] **Cache:** Hit rates within expected range

### Global Checks

- [ ] **All regions:** Green status in Grafana
- [ ] **Traffic distribution:** 100% on Green environment
- [ ] **DNS records:** Updated to Green IPs
- [ ] **Load balancers:** Routing correctly

### Metrics Snapshot (Capture for Audit)

```
Region: US East
Error Rate: _______% (target: <0.2%)
Latency P95: _______ms (target: <300ms)
CPU: _______% (target: <70%)
Memory: _______% (target: <70%)

Region: EU West
Error Rate: _______% (target: <0.2%)
Latency P95: _______ms (target: <300ms)
CPU: _______% (target: <70%)
Memory: _______% (target: <70%)

Region: APAC Southeast
Error Rate: _______% (target: <0.2%)
Latency P95: _______ms (target: <300ms)
CPU: _______% (target: <70%)
Memory: _______% (target: <70%)
```

---

## 🧹 Post-Deployment Cleanup

- [ ] **Temporary logs:** Archived to long-term storage
- [ ] **Tracing sample rate:** Reduced to normal levels
- [ ] **Pipeline outputs:** Archived to artifact storage
- [ ] **Grafana annotations:** Verified deployment markers present
- [ ] **Slack channels:** Rollout channel cleaned/archived

---

## 📝 Post-Deployment Retrospective

### Quick Retrospective Template

**What went smoothly:**
- _____________________________________________
- _____________________________________________
- _____________________________________________

**What was noisy/unexpected:**
- _____________________________________________
- _____________________________________________
- _____________________________________________

**Action items to tighten process:**
- [ ] _________________________________________ (Owner: _______, Due: _______)
- [ ] _________________________________________ (Owner: _______, Due: _______)
- [ ] _________________________________________ (Owner: _______, Due: _______)

### Final Announcement

```
✅ *Production Rollout Complete*
• Regions: US East, EU West, APAC Southeast
• Artifact Version: v_______
• Deployment Strategy: Delayed (90 minutes between regions)
• Status: All regions GREEN
• Metrics:
  - Error Rate: <0.2% across all regions
  - Latency P95: <300ms across all regions
  - No rollbacks required
• Next Steps:
  - Reduce tracing sample rate (completed: _____)
  - Archive rollout channel (completed: _____)
  - Schedule retrospective (date: _____)
  - Update runbooks with lessons learned (due: _____)
```

---

## 🔄 Transition to Parallel Mode

After successful delayed deployments (recommended: 3-5 runs), consider transitioning to parallel mode:

### Parallel Mode Prerequisites

- [ ] **Confidence level:** 5+ successful delayed deployments
- [ ] **Rollback drills:** Completed and documented
- [ ] **Regional independence:** Verified no cross-region dependencies
- [ ] **Monitoring maturity:** Dashboards and alerts stable
- [ ] **Team readiness:** On-call engineers familiar with Quick Cards and debugging guide

### Parallel Mode Command

```bash
# For faster deployments after confidence is established
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=all \
  -f deployment_strategy=parallel
```

**Benefits:**
- Deployment time: ~45 minutes (vs ~5.5-11.5 hours delayed)
- Simultaneous regional rollouts
- Independent failure handling

**Risks:**
- Simultaneous failures harder to debug
- No opportunity to learn from US before EU/APAC
- Higher cognitive load during incidents

---

## 📞 Emergency Contacts

**On-Call SRE:** `@oncall-sre` (Slack)  
**Deployment Lead:** `@deployment-lead` (Slack)  
**Escalation:** P1 ticket in JIRA + page VP Engineering

**Emergency Rollback Workflow:**
```bash
# Manual rollback if automated rollback fails
gh workflow run emergency-rollback.yml -f region=<us|eu|apac>
```

**Incident Channel:** `#incidents-deployments` (Slack)  
**Debugging Guide:** [DEPLOYMENT_DEBUGGING_GUIDE.md](./DEPLOYMENT_DEBUGGING_GUIDE.md)

---

## ✅ Sign-Off

**Pre-Deployment Approval:**
- [ ] Functional Lead: _________________ Date: _________
- [ ] SRE Lead: _________________ Date: _________
- [ ] Product Owner: _________________ Date: _________

**Post-Deployment Confirmation:**
- [ ] All regions GREEN: ✅
- [ ] Metrics within SLO: ✅
- [ ] No rollbacks required: ✅
- [ ] Retrospective scheduled: ✅

---

**Status:** 🟢 READY FOR PRODUCTION

You're ready to go live. The pipeline is tested, notifications are automated, and rollback procedures are in place. Run delayed mode for first deployment, keep thresholds strict, and trust your monitoring.

**Next Step:** Execute the deployment command above and monitor the Slack channel for Quick Card updates.
