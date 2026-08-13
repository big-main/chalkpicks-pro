# ChalkPicks Migration Export Manifest

The Manus TiDB database export completed on **2026-08-13 06:17:49 UTC**. The connection endpoint and credential values are intentionally omitted. The source reported TiDB `8.0.11-TiDB-v8.5.3-serverless`.

The dump contains 47 application and migration tables. The largest data sets are `arbitrage_opportunities` (approximately 125,137 rows), `notification_logs` (3,709), `games` (583), `picks` (570), `promo_codes` (213), `story_exports` (1,593), `pick_ledger` (75), `blog_posts` (40), and `users` (30). The export also includes `backtests` (2), `subscription_orders` (2), and `user_bets` (5), which are important for validating the replacement service.

The portable SQL file is stored outside the web project at `/home/ubuntu/chalkpicks-migration-export/manus-database.sql`. It was created using a TiDB-compatible `mysqldump` mode with table locks disabled. It must be handled as sensitive production data and must not be committed to GitHub or bundled into a public web deployment.

The next step is to provision the replacement database and import this dump through a private connection, then configure the application secrets through Railway's authenticated UI. No DNS change has occurred, and the Manus deployment remains the rollback source.
