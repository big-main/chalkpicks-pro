-- Add CLV (Closing Line Value) tracking to user_bets table
-- CLV measures how your bet odds compare to the closing line

ALTER TABLE user_bets 
ADD COLUMN closingLineOdds INT COMMENT 'Closing line odds when bet settled',
ADD COLUMN closingLineTime TIMESTAMP COMMENT 'Time when closing line was recorded',
ADD COLUMN clvValue DECIMAL(5, 2) COMMENT 'CLV percentage (positive = got better odds)',
ADD COLUMN lineMovement INT COMMENT 'Total line movement in cents',
ADD COLUMN sharpMoney BOOLEAN DEFAULT FALSE COMMENT 'Whether sharp money was detected on this bet',
ADD COLUMN bookmakerName VARCHAR(64) COMMENT 'Which sportsbook the bet was placed at',
ADD COLUMN betPlacedTime TIMESTAMP COMMENT 'Exact time bet was placed';

-- Create CLV statistics table for tracking aggregate metrics
CREATE TABLE IF NOT EXISTS clv_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  periodStart VARCHAR(16) NOT NULL,
  periodEnd VARCHAR(16) NOT NULL,
  totalBets INT DEFAULT 0,
  winningBets INT DEFAULT 0,
  losingBets INT DEFAULT 0,
  pushBets INT DEFAULT 0,
  averageCLV DECIMAL(5, 2) DEFAULT 0,
  positiveCLVBets INT DEFAULT 0,
  negativeCLVBets INT DEFAULT 0,
  totalProfit DECIMAL(10, 2) DEFAULT 0,
  profitWithPositiveCLV DECIMAL(10, 2) DEFAULT 0,
  profitWithNegativeCLV DECIMAL(10, 2) DEFAULT 0,
  winRateOverall DECIMAL(5, 2) DEFAULT 0,
  winRateWithPositiveCLV DECIMAL(5, 2) DEFAULT 0,
  winRateWithNegativeCLV DECIMAL(5, 2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_period (userId, periodStart, periodEnd)
);

-- Create index for faster CLV queries
CREATE INDEX idx_user_bets_clv ON user_bets(userId, clvValue);
CREATE INDEX idx_user_bets_sharp_money ON user_bets(userId, sharpMoney);
CREATE INDEX idx_clv_statistics_user ON clv_statistics(userId, periodStart);
