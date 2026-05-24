import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chalkpicks",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const LAUNCH_CODES = [
  {
    code: "LAUNCH50",
    discountType: "percentage",
    discountValue: 50.00,
    tier: "monthly",
    maxUses: 100,
    source: "launch",
    description: "50% off first month - Launch promotion"
  },
  {
    code: "SPORTS20",
    discountType: "percentage",
    discountValue: 20.00,
    tier: "yearly",
    maxUses: 50,
    source: "email",
    description: "20% off yearly subscription"
  },
  {
    code: "TWITTER50",
    discountType: "percentage",
    discountValue: 50.00,
    tier: "daily",
    maxUses: 200,
    source: "twitter",
    description: "50% off daily pass - Twitter exclusive"
  },
  {
    code: "REDDIT25",
    discountType: "percentage",
    discountValue: 25.00,
    tier: "monthly",
    maxUses: 75,
    source: "reddit",
    description: "25% off monthly - Reddit community"
  },
  {
    code: "BETTERSCORE",
    discountType: "fixed",
    discountValue: 10.00,
    tier: "monthly",
    maxUses: 100,
    source: "affiliate",
    description: "$10 off monthly subscription"
  },
];

async function seedCodes() {
  const connection = await pool.getConnection();
  
  try {
    console.log("🌱 Seeding promo codes...");
    
    for (const code of LAUNCH_CODES) {
      const sql = `
        INSERT INTO promo_codes 
        (code, discountType, discountValue, tier, maxUses, currentUses, source, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 0, ?, true, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        isActive = true, updatedAt = NOW()
      `;
      
      await connection.execute(sql, [
        code.code,
        code.discountType,
        code.discountValue,
        code.tier,
        code.maxUses,
        code.source,
      ]);
      
      console.log(`✅ Created/Updated: ${code.code} - ${code.description}`);
    }
    
    console.log("\n✨ All promo codes seeded successfully!");
    
    // Show summary
    const [rows] = await connection.execute("SELECT code, tier, discountValue, discountType, maxUses, currentUses FROM promo_codes WHERE isActive = true");
    console.log("\n📊 Active Promo Codes:");
    console.table(rows);
    
  } catch (error) {
    console.error("❌ Error seeding codes:", error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedCodes();
