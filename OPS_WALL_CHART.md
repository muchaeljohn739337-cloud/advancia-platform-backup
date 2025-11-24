# 🛠️ Ops Wall Chart — Day-2 Calendar Timeline

| Frequency     | Tasks                   | Commands/Tools                        | Notes                                         |
| ------------- | ----------------------- | ------------------------------------- | --------------------------------------------- |
| **Daily**     | Service Health Checks   | `docker ps`, `docker-compose logs -f` | Confirm backend, frontend, DB, Nginx running  |
| **Daily**     | Performance Monitoring  | DigitalOcean Monitoring               | CPU, memory, disk usage                       |
| **Daily**     | Error Tracking          | Sentry Dashboard                      | Frontend/backend errors                       |
| **Daily**     | Security Scans          | Cloudflare Analytics                  | Blocked threats, SSL cert validity            |
| **Weekly**    | Database Backups        | `pg_dump`                             | Store securely, verify restore                |
| **Weekly**    | Log Reviews             | Backend logs, Nginx logs              | Anomalies, access/error logs                  |
| **Weekly**    | Dependency Updates      | `npm audit`                           | Backend/frontend security patches             |
| **Weekly**    | Cloudflare Rules        | WAF, Rate Limiting                    | Effectiveness review                          |
| **Weekly**    | CI/CD Testing           | GitHub Actions                        | Deploy workflow test                          |
| **Monthly**   | Resource Scaling        | Droplet usage                         | Resize if needed, load balancer consideration |
| **Monthly**   | API Key Rotation        | Stripe, Plaid, JWT                    | Security audit                                |
| **Monthly**   | Firewall Audit          | UFW rules                             | Review access controls                        |
| **Monthly**   | Compliance Checks       | GDPR/PCI DSS logs                     | Audit log integrity                           |
| **Monthly**   | Disaster Recovery       | DB restore simulation                 | Backup verification                           |
| **Quarterly** | Feature Roadmap         | Multi-tenancy, analytics, uploads     | Enhancement planning                          |
| **Quarterly** | Infrastructure Upgrades | Kubernetes migration                  | Scaling demands                               |
| **Quarterly** | Zero Trust Security     | Cloudflare Access                     | Admin route protection                        |
| **Quarterly** | Cost Optimization       | DigitalOcean, Datadog billing         | Usage review                                  |

## 📅 Timeline Overview

```
Daily ──────────────────────────────────────────────────────────────
│ Service Health │ Monitoring │ Errors │ Security │ DB Health │
└───────────────────────────────────────────────────────────────────┘

Weekly ─────────────────────────────────────────────────────────────
│ Backups │ Logs │ Updates │ Cloudflare │ CI/CD │
└───────────────────────────────────────────────────────────────────┘

Monthly ────────────────────────────────────────────────────────────
│ Scaling │ Keys │ Firewall │ Compliance │ Disaster Recovery │
└───────────────────────────────────────────────────────────────────┘

Quarterly ──────────────────────────────────────────────────────────
│ Roadmap │ Infra │ Zero Trust │ Costs │
└───────────────────────────────────────────────────────────────────┘
```

## ✅ Quick Reference

-   **Daily**: Health checks, monitoring, errors, security
-   **Weekly**: Backups, logs, updates, rules, pipeline
-   **Monthly**: Scaling, security, compliance, recovery
-   **Quarterly**: Planning, upgrades, security, costs

⚡ Print this chart or keep it open — it's your operational rhythm at a glance!
