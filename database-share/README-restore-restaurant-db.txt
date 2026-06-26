Restaurant demo database backup

Backup file:
restaurant_db-demo-20260617-145611.dump

Test users:
ADMIN001
MANAGER001
CASHIER001
CHEF001
WAITER001

Password for all test users:
12345678

PostgreSQL connection used to create this backup:
database: restaurant_db
user: postgres
password: 123456
host: localhost
port: 5432

Restore on friend's computer:

1. Extract the zip file.

2. Open PowerShell where the .dump file exists.

3. Set PostgreSQL password:
$env:PGPASSWORD="123456"

4. Recreate the database:
& "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" -h localhost -U postgres --if-exists restaurant_db
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -h localhost -U postgres restaurant_db

5. Restore backup:
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h localhost -U postgres -d restaurant_db --clean --if-exists --no-owner --no-privileges ".\restaurant_db-demo-20260617-145611.dump"

6. Verify:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d restaurant_db -c "select count(*) from menus; select count(*) from menu_items; select count(*) from users; select count(*) from floors; select count(*) from tables;"

Expected data:
4 menus
26 menu items
5 test users
2 floors
8 tables
