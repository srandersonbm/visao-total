# Visão Total

Sistema de gestão para a Visão Total Vistorias: dashboards de desempenho,
cadastro de vistorias, agendamentos, transferências via despachante,
conciliação de cartões e relatórios em PDF/Excel — sincronizado em tempo real
entre o PC e o celular.

## Estrutura

- `frontend/` — página única (HTML + CSS + JS puro, sem build), publicada no
  GitHub Pages.
- `backend/` — API em Node.js + Express, banco local (arquivo SQLite via
  libSQL), rodando neste PC. Expõe os dados por REST e avisa mudanças em
  tempo real por Server-Sent Events.

## Como rodar o backend (neste PC)

```bash
cd backend
npm install
cp .env.example .env      # depois edite o .env e troque o ACCESS_TOKEN
npm run seed               # popula com os dados já importados da planilha (backend/seed-data/, local, fora do git por privacidade)
npm start                  # sobe em http://localhost:4400
```

Em produção, use o pm2 (arquivo `ecosystem.config.js` na raiz):

```bash
pm2 start ecosystem.config.js
pm2 save
```

### Deixando acessível pela internet (celular fora da rede do escritório)

O backend fica só na rede local por padrão. Para o celular acessar de
qualquer lugar, ele é publicado através do túnel Cloudflare já usado por
outros projetos deste PC, adicionando um **Public Hostname** no túnel
existente (Cloudflare Zero Trust → Networks → Tunnels):

- Subdomínio: `vt`
- Domínio: `heringfotografia.com.br`
- Tipo: HTTP
- URL: `localhost:4400`

Assim que o hostname `vt.heringfotografia.com.br` estiver roteado, a API
fica acessível dali — sem precisar de outro processo de túnel.

## Como rodar o frontend localmente

Como é uma página estática, basta abrir `frontend/index.html` num servidor
simples:

```bash
cd frontend
python3 -m http.server 5183
```

Acesse http://localhost:5183 — na primeira vez, o app pede o **endereço do
servidor** (ex.: `https://vt.heringfotografia.com.br` ou `http://localhost:4400`
para testar local) e o **token de acesso** (o mesmo `ACCESS_TOKEN` do
`backend/.env`). Fica guardado no navegador; dá para trocar depois pelo botão
"Alterar conexão" no rodapé do menu lateral.

## Deploy do frontend

**GitHub Pages**, via o workflow em `.github/workflows/deploy-pages.yml`.
Ative o GitHub Pages nas configurações do repositório (Settings → Pages →
Source: GitHub Actions) — todo push em `frontend/` publica sozinho, sem passo
de build.

## Como funciona

- **Dados**: tudo fica em seis "coleções" (vistorias, evolução, agendamentos,
  transferências, conciliação, configurações), guardadas no banco local do
  backend. O front-end lê e escreve tudo por uma API REST simples
  (`/api/collections/:nome`) e recebe avisos em tempo real por SSE
  (`/api/events`) — por isso o PC e o celular ficam sempre sincronizados.
- **Acesso**: como o backend fica exposto pela internet, toda chamada exige o
  token de `ACCESS_TOKEN` (cabeçalho `x-access-token`). Sem o token certo, a
  API responde 401 e o app pede a conexão de novo.
- **Relatórios**: PDF (jsPDF + autotable) e Excel (SheetJS) são gerados no
  próprio navegador e baixados diretamente — não passam pelo backend.
