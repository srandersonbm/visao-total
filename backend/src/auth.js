// Como o backend fica exposto publicamente (via túnel), toda rota de API exige
// um token de acesso simples — configurado em ACCESS_TOKEN no .env. O
// front-end pede esse token uma vez e guarda no navegador.
function authMiddleware(req, res, next) {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected) return next(); // nenhum token configurado: acesso liberado (não recomendado)

  const provided = req.headers['x-access-token'] || req.query.token;
  if (provided !== expected) {
    return res.status(401).json({ error: 'Acesso negado. Verifique o token de acesso.' });
  }
  next();
}

module.exports = { authMiddleware };
