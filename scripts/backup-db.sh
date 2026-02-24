#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# backup-db.sh — Sauvegarde de la base de données SQLite
# Usage : bash scripts/backup-db.sh
# Automatisation : ajouter dans crontab pour des sauvegardes régulières
#   0 3 * * * cd ~/Warmachine_Project && bash scripts/backup-db.sh
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_SRC="$PROJECT_DIR/data/database.sqlite"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/database_$TIMESTAMP.sqlite"

# Vérifier que la BDD existe
if [ ! -f "$DB_SRC" ]; then
  echo "❌ Base de données introuvable : $DB_SRC"
  exit 1
fi

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# Copier la BDD
cp "$DB_SRC" "$BACKUP_FILE"
echo "✅ Backup créé : $BACKUP_FILE"

# Garder uniquement les 10 derniers backups
ls -t "$BACKUP_DIR"/database_*.sqlite | tail -n +11 | xargs -r rm --
echo "🗑️  Anciens backups nettoyés (conserve les 10 derniers)"
