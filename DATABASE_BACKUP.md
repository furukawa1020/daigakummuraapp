# データベースバックアップとリストアガイド

## 自動バックアップスクリプト

### 1. バックアップスクリプト作成

```bash
# backend/scripts/backup-database.sh
#!/bin/bash

# 設定
DB_NAME="shiramine_village"
DB_USER="your_username"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# バックアップディレクトリ作成
mkdir -p $BACKUP_DIR

# バックアップ実行
pg_dump -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE

# 古いバックアップを削除（30日以上前）
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 2. 自動バックアップ設定（cron）

```bash
# 毎日午前3時にバックアップ実行
0 3 * * * /path/to/backend/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

## リストア手順

### 1. バックアップからリストア

```bash
# データベースを再作成
dropdb shiramine_village
createdb shiramine_village

# バックアップファイルからリストア
pg_restore -U your_username -d shiramine_village -v backups/shiramine_village_20240101_030000.sql
```

### 2. 特定のテーブルのみリストア

```bash
# 特定のテーブルのみ
pg_restore -U your_username -d shiramine_village -t users -v backups/backup.sql
```

## データ永続化の確認

### PostgreSQL設定確認

```sql
-- データベース設定確認
SHOW data_directory;
SHOW config_file;

-- 接続数確認
SELECT count(*) FROM pg_stat_activity;

-- データベースサイズ確認
SELECT pg_size_pretty(pg_database_size('shiramine_village'));

-- テーブル別サイズ確認
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### データ整合性チェック

```sql
-- 外部キー制約チェック
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';

-- インデックスの健全性チェック
REINDEX DATABASE shiramine_village;

-- テーブル統計更新
VACUUM ANALYZE;
```

## 本番環境推奨設定

### postgresql.conf の推奨設定

```conf
# 接続設定
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB

# ログ設定
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # 1秒以上のクエリをログ
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# WAL設定（レプリケーション用）
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
```

### Docker Compose での永続化

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: shiramine_village
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    volumes:
      # データ永続化
      - postgres_data:/var/lib/postgresql/data
      # バックアップ
      - ./backups:/backups
    restart: unless-stopped
    
volumes:
  postgres_data:
    driver: local
```

## トランザクションベストプラクティス

### アプリケーションでの使用例

```javascript
import { withTransaction } from './db/transactions.js';

// 複数操作をアトミックに実行
const result = await withTransaction(async (tx) => {
  // ユーザー作成
  const user = await tx.query(
    'INSERT INTO users (email, nickname) VALUES ($1, $2) RETURNING id',
    [email, nickname]
  );
  
  // チャンネル参加
  await tx.query(
    'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
    [channelId, user.rows[0].id]
  );
  
  return user.rows[0];
});
```

## モニタリング

### 重要な監視項目

1. **データベース接続数**
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```

2. **長時間実行クエリ**
   ```sql
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 seconds';
   ```

3. **デッドロック検出**
   ```sql
   SELECT * FROM pg_stat_database WHERE datname = 'shiramine_village';
   ```

4. **ディスク使用量**
   ```bash
   df -h /var/lib/postgresql/data
   ```
