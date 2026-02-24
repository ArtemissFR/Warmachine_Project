#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// init-db.js — Initialisation de la base de données SQLite
// Usage : node scripts/init-db.js
// Idempotent : peut être relancé sans risque de perte de données
// ─────────────────────────────────────────────────────────────────────────────

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

// Créer le dossier data s'il n'existe pas
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`[init-db] Dossier créé : ${dataDir}`);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('[init-db] ❌ Erreur d\'ouverture :', err.message);
        process.exit(1);
    }
    console.log(`[init-db] ✅ Connexion à : ${DB_PATH}`);
});

db.serialize(() => {
    // Table des séances de musculation
    db.run(`
    CREATE TABLE IF NOT EXISTS gym_entries (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      date     TEXT    NOT NULL,
      exercise TEXT    NOT NULL,
      category TEXT,
      weight   REAL,
      reps     INTEGER
    )
  `, (err) => {
        if (err) console.error('[init-db] ❌ gym_entries :', err.message);
        else console.log('[init-db] ✅ Table gym_entries prête');
    });

    // Table du poids corporel
    db.run(`
    CREATE TABLE IF NOT EXISTS body_weight (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      date   TEXT  NOT NULL,
      weight REAL  NOT NULL
    )
  `, (err) => {
        if (err) console.error('[init-db] ❌ body_weight :', err.message);
        else console.log('[init-db] ✅ Table body_weight prête');
    });
});

db.close((err) => {
    if (err) {
        console.error('[init-db] ❌ Erreur fermeture :', err.message);
        process.exit(1);
    }
    console.log('[init-db] 🎉 Base de données initialisée avec succès.');
});
