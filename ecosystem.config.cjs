const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.production
const envFile = path.join(__dirname, '.env.production');
const envVars = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};

module.exports = {
  apps: [
    {
      name: 'chalkpicks-prod',
      script: './dist/index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        ...envVars,
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
