# Backup Restore Test History

### Test Run: 2025-11-18_01-46-22

Source DB: advancia_pay | Test DB: advancia_restore_test
Backup File: db-backup-2025-11-18_01-46-22.sql
Result: ❌ FAIL

| Table              | Source Rows | Restored Rows | Status    |
| ------------------ | ----------: | ------------: | --------- |
| users              |          -1 |            -1 | exception |
| transactions       |          -1 |            -1 | exception |
| token_wallets      |          -1 |            -1 | exception |
| token_transactions |          -1 |            -1 | exception |
| crypto_wallets     |          -1 |            -1 | exception |
| admin_wallets      |          -1 |            -1 | exception |
| audit_logs         |          -1 |            -1 | exception |

Notes: Differences detected. Investigate before launch.

### Test Run: 2025-11-18_01-55-14

Source DB: advancia_pay | Test DB: advancia_restore_test
Backup File: db-backup-2025-11-18_01-55-14.sql
Result: ❌ FAIL

| Table              | Source Rows | Restored Rows | Status      |
| ------------------ | ----------: | ------------: | ----------- |
| users              |          -1 |            -1 | table_error |
| transactions       |          -1 |            -1 | table_error |
| token_wallets      |          -1 |            -1 | table_error |
| token_transactions |          -1 |            -1 | table_error |
| crypto_wallets     |          -1 |            -1 | table_error |
| admin_wallets      |          -1 |            -1 | table_error |
| audit_logs         |          -1 |            -1 | table_error |

Notes: Differences detected. Investigate before launch.

### Test Run: 2025-11-18_02-48-26

Source DB: advancia_pay | Test DB: advancia_restore_test
Backup File: db-backup-2025-11-18_02-48-26.sql
Result: ❌ FAIL

| Table              | Source Rows | Restored Rows | Status      |
| ------------------ | ----------: | ------------: | ----------- |
| users              |          -1 |            -1 | table_error |
| transactions       |          -1 |            -1 | table_error |
| token_wallets      |          -1 |            -1 | table_error |
| token_transactions |          -1 |            -1 | table_error |
| crypto_wallets     |          -1 |            -1 | table_error |
| admin_wallets      |          -1 |            -1 | table_error |
| audit_logs         |          -1 |            -1 | table_error |

Notes: Differences detected. Investigate before launch.

### Test Run: 2025-11-18_03-20-56

Source DB: advancia_db | Test DB: advancia_restore_test
Backup File: db-backup-2025-11-18_03-20-56.sql
Result: ❌ FAIL

| Table              | Source Rows | Restored Rows | Status      |
| ------------------ | ----------: | ------------: | ----------- |
| users              |           1 |             1 | ok          |
| transactions       |           0 |             0 | ok          |
| token_wallets      |           0 |             0 | ok          |
| token_transactions |           0 |             0 | ok          |
| crypto_wallets     |           0 |             0 | ok          |
| admin_wallets      |          -1 |            -1 | table_error |
| audit_logs         |           0 |             0 | ok          |

Notes: Differences detected. Investigate before launch.
