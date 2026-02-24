# ─────────────────────────────────────────────────────────────────────────────
# Warmachine Portfolio — Dockerfile
# Node.js 18 LTS (slim) — Production
# ─────────────────────────────────────────────────────────────────────────────

FROM node:18-slim

# Métadonnées
LABEL maintainer="ArtemissFR" \
      description="Warmachine Portfolio — Express + SQLite" \
      version="1.0.0"

# Répertoire de travail
WORKDIR /usr/src/app

# ── Dépendances ──────────────────────────────────────────────────────────────
# Copier les manifestes en premier pour profiter du cache Docker
COPY package*.json ./

# Installer les dépendances de production uniquement
# Avec retries et timeouts étendus pour les environnements réseau instables
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --omit=dev \
 && npm cache clean --force

# ── Code source ──────────────────────────────────────────────────────────────
COPY . .

# ── Données persistantes ─────────────────────────────────────────────────────
# Créer le dossier data et régler les permissions
RUN mkdir -p /usr/src/app/data \
 && chown -R node:node /usr/src/app

# Utiliser l'utilisateur non-root "node" fourni par l'image officielle
USER node

# ── Configuration ─────────────────────────────────────────────────────────────
EXPOSE 3000
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/usr/src/app/data/database.sqlite

# ── Healthcheck ───────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# ── Démarrage ─────────────────────────────────────────────────────────────────
CMD ["node", "server.js"]
