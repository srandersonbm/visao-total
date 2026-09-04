// Mesmo padrão usado no damata e no Hering: um processo pm2 para a API e um
// para o túnel Cloudflare (tunnel run --token ...), cada um com seu próprio
// túnel dedicado — vt.heringfotografia.com.br aponta para a porta 4400.
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const rootEnv = loadEnv(path.join(__dirname, '.env'));

module.exports = {
  apps: [
    {
      name: 'visao-total-api',
      script: 'src/index.js',
      cwd: __dirname + '/backend',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 20,
      watch: false,
    },
    {
      name: 'visao-total-tunnel',
      script: `${require('os').homedir()}/.local/bin/cloudflared`,
      args: ['tunnel', 'run', '--token', rootEnv.CLOUDFLARE_TUNNEL_TOKEN],
      cwd: __dirname,
      autorestart: true,
      max_restarts: 20,
      watch: false,
    },
  ],
};
