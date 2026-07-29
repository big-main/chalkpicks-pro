-- Pick Ledger: immutable, hash-locked pick commits for public verification.
-- Smoking bullet: prove every pick was locked pre-game and graded fairly.

CREATE TABLE IF NOT EXISTS pick_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pickId INT NOT NULL,
  contentHash VARCHAR(64) NOT NULL COMMENT 'SHA-256 of canonical locked payload',
  lockedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Wall-clock lock time (must be before game start)',
  gameStartAt TIMESTAMP NULL COMMENT 'Scheduled game/event start used for pre-game proof',
  payloadJson JSON NOT NULL COMMENT 'Canonical snapshot of fields that were hashed',
  recommendation VARCHAR(255) NULL,
  sportKey VARCHAR(32) NULL,
  homeTeam VARCHAR(128) NULL,
  awayTeam VARCHAR(128) NULL,
  lineAtLock DECIMAL(10, 3) NULL COMMENT 'Line/odds at lock time',
  closingLine DECIMAL(10, 3) NULL COMMENT 'Closing line recorded at/near game start',
  clvValue DECIMAL(8, 4) NULL COMMENT 'CLV vs closing line (positive = beat close)',
  result ENUM('pending', 'win', 'loss', 'push', 'void') NOT NULL DEFAULT 'pending',
  gradedAt TIMESTAMP NULL,
  isPublic TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = visible on /verify and public ledger',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pick_ledger_pick (pickId),
  UNIQUE KEY uq_pick_ledger_hash (contentHash),
  KEY idx_pick_ledger_locked (lockedAt),
  KEY idx_pick_ledger_result (result),
  KEY idx_pick_ledger_public (isPublic, lockedAt),
  CONSTRAINT fk_pick_ledger_pick FOREIGN KEY (pickId) REFERENCES picks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
