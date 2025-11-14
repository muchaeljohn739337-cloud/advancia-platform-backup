# DigitalOcean PostgreSQL Setup for Testing

This guide sets up PostgreSQL on your DigitalOcean droplet for running the test suite.

## Quick Setup (5 minutes)

### 1. SSH into Your Droplet

```bash
ssh root@157.245.8.131
```

### 2. Update System

```bash
apt update && apt upgrade -y
```

### 3. Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
```

### 4. Start PostgreSQL Service

```bash
systemctl start postgresql
systemctl enable postgresql
```

### 5. Create Test Database and User

```bash
sudo -u postgres psql << EOF
-- Create test database
CREATE DATABASE advancia_payledger_test;

-- Create a test user with password
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;

-- Connect to the database
\c advancia_payledger_test

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;

-- Exit
\q
EOF
```

### 6. Configure PostgreSQL for Remote Connections

Edit `/etc/postgresql/14/main/postgresql.conf` (adjust version if needed):

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Find and change:

```conf
listen_addresses = 'localhost'
```

to:

```conf
listen_addresses = '*'
```

### 7. Configure pg_hba.conf for Remote Access

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line at the end (before the file ends):

```conf
host    all             all             0.0.0.0/0               md5
```

### 8. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### 9. Verify It's Listening

```bash
sudo ss -tlnp | grep postgres
```

You should see PostgreSQL listening on port 5432.

---

## Update Your Local .env.test

On your **local machine** (Windows), update `.env.test`:

```bash
# Your DigitalOcean droplet IP: 157.245.8.131
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

---

## Run Prisma Migrations

On your **local machine**, run:

```bash
cd backend
npx prisma migrate deploy
```

Or to reset the test database:

```bash
npx prisma migrate reset --force
```

---

## Run Tests

```bash
cd backend
npm test
```

---

## Troubleshooting

### Connection Refused?

```bash
# Check if PostgreSQL is running on droplet
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

### Permission Denied?

```bash
# Verify user exists and has correct password
sudo -u postgres psql << EOF
\du
SELECT datname FROM pg_database WHERE datname = 'advancia_payledger_test';
\q
EOF
```

### Can't Connect from Windows?

1. Check firewall on droplet:

   ```bash
   sudo ufw status
   sudo ufw allow 5432/tcp
   ```

2. Test connection from Windows:
   ```powershell
   # Install psql if needed, then:
   psql -h 157.245.8.131 -U test_user -d advancia_payledger_test -W
   # Enter password: test_password_123
   ```

### Port 5432 Already in Use?

```bash
# Check what's using it
sudo ss -tlnp | grep 5432

# Or configure PostgreSQL to use different port (not recommended for tests)
```

---

## Security Notes

⚠️ **For production**, use stronger passwords and restrict access to specific IPs.

For testing only, the above setup is acceptable.

---

## Optional: Create a PostgreSQL User with Limited Privileges (More Secure)

```bash
sudo -u postgres psql << EOF
-- Create test user with limited privileges
CREATE USER test_user_limited WITH ENCRYPTED PASSWORD 'test_password_123';

-- Create test database
CREATE DATABASE advancia_payledger_test OWNER test_user_limited;

-- Only allow this user to connect from specific IPs
-- (Update pg_hba.conf instead for IP-based restrictions)

\q
EOF
```

Then in `pg_hba.conf`, use:

```conf
host    advancia_payledger_test  test_user_limited  YOUR_WINDOWS_IP/32  md5
```

---

## Next Steps

1. Run the setup commands on your DigitalOcean droplet
2. Update `.env.test` on your local machine with your droplet IP
3. Run `npx prisma migrate deploy` locally
4. Run `npm test` to verify everything works
