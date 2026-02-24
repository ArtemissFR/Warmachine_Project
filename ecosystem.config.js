// ─────────────────────────────────────────────────────────────────────────────
// PM2 Ecosystem — Warmachine Portfolio
// Remplace Docker pour la gestion du processus Node.js
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      // ── Identité ──────────────────────────────────────────────────────────
      name: 'warmachine',
      script: 'server.js',

      // ── Environnement ─────────────────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: './data/database.sqlite',
      },

      // ── Logs ─────────────────────────────────────────────────────────────
      // Les logs sont stockés dans ~/.pm2/logs/ par défaut
      out_file: './logs/out.log',       // stdout
      error_file: './logs/error.log',   // stderr
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // ── Redémarrage automatique ───────────────────────────────────────────
      // Redémarre si le process crash ou si la mémoire dépasse 200 Mo
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',            // Considère le process stable après 10s
      max_memory_restart: '200M',

      // ── Watch (désactivé en prod) ─────────────────────────────────────────
      watch: false,

      // ── Instances ────────────────────────────────────────────────────────
      // 1 instance suffit pour SQLite (SQLite ne supporte pas le multi-process)
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
