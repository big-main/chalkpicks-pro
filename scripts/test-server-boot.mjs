import { spawn } from "child_process";

const env = {
  ...process.env,
  NODE_ENV: "production",
  JWT_SECRET: "chalkpicks_production_jwt_secret_2026_secure_key_992352",
  DATABASE_URL: "mysql://user:pass@localhost:3306/db",
  PORT: "3005",
};

console.log("Starting bundled server for 4 seconds...");
const child = spawn("node", ["dist/index.js"], { env, stdio: "pipe" });

let output = "";
child.stdout.on("data", (d) => { output += d.toString(); });
child.stderr.on("data", (d) => { output += d.toString(); });

setTimeout(() => {
  child.kill();
  console.log("Server output snippet:\n", output.slice(0, 1000));
}, 4000);
