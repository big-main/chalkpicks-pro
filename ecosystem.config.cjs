module.exports = {
  apps: [{
    name: 'chalkpicks',
    script: 'dist/index.js',
    cwd: '/home/ubuntu/chalkpicks',
    env_file: '.env',
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
