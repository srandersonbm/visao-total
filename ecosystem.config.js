// Mesmo padrão usado no damata e no Hering: um processo pm2 para a API.
// As variáveis (PORT, ACCESS_TOKEN) vêm de backend/.env — o próprio backend
// já lê esse arquivo ao iniciar (dotenv), então não precisamos repetir aqui.
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
  ],
};
