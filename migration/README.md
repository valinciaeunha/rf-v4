# Database Migration Guide
# MariaDB to PostgreSQL using pgloader

## Quick Start

### 1. Start all services (including MariaDB source)
```bash
docker compose up -d 
```

### 2. Wait for MariaDB to import data (check logs)
```bash
docker logs -f redfinger-mariadb-source
```
Wait until you see "ready for connections" - the SQL file import may take 5-10 minutes.

### 3. Run migration
```bash
# Full migration (creates schema + copies data)
docker exec -it redfinger-pgloader pgloader /migration/migrate.load

# OR data-only (if schema already exists)
docker exec -it redfinger-pgloader pgloader /migration/migrate-data-only.load
```

### 4. Verify migration
```bash
# Check row counts
docker exec -it redfinger-postgres psql -U postgres -d redfinger_v4 -c "SELECT 'users' as tbl, COUNT(*) FROM users UNION ALL SELECT 'products', COUNT(*) FROM products UNION ALL SELECT 'transactions', COUNT(*) FROM transactions UNION ALL SELECT 'deposits', COUNT(*) FROM deposits;"
```

### 5. Stop MariaDB after migration (optional)
```bash
docker compose stop mariadb pgloader
```

## Troubleshooting

### Check MariaDB data
```bash
docker exec -it redfinger-mariadb-source mysql -uroot -prootpassword redfing1_db -e "SELECT COUNT(*) FROM users;"
```

### Check PostgreSQL data  
```bash
docker exec -it redfinger-postgres psql -U postgres -d redfinger_v4 -c "SELECT COUNT(*) FROM users;"
```

### View pgloader logs
```bash
docker logs redfinger-pgloader
```
