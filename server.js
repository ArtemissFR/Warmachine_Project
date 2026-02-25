const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'database.sqlite');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const multer = require('multer');

// ...

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    store: new SQLiteStore({ dir: dataDir, db: 'sessions.sqlite' }),
    secret: 'warmachine-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Multer Storage for Profile Pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `profile_${req.session.userId}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// Database Initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database opening error:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            profile_picture TEXT DEFAULT '/uploads/default-profile.png',
            accent_color TEXT DEFAULT '#6366f1',
            first_name TEXT DEFAULT '',
            last_name TEXT DEFAULT '',
            gender TEXT DEFAULT '',
            height INTEGER DEFAULT 0,
            age INTEGER DEFAULT 0
        )`);

        // Migration: Add new columns to existing users if missing
        db.all(`PRAGMA table_info(users)`, (err, columns) => {
            if (err) return;
            const existing = columns.map(c => c.name);
            const needed = [
                { name: 'accent_color', type: 'TEXT DEFAULT "#6366f1"' },
                { name: 'first_name', type: 'TEXT DEFAULT ""' },
                { name: 'last_name', type: 'TEXT DEFAULT ""' },
                { name: 'email', type: 'TEXT DEFAULT ""' },
                { name: 'gender', type: 'TEXT DEFAULT ""' },
                { name: 'height', type: 'INTEGER DEFAULT 0' },
                { name: 'age', type: 'INTEGER DEFAULT 0' }
            ];
            needed.forEach(col => {
                if (!existing.includes(col.name)) {
                    db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
                }
            });
        });

        // Migration: Add user_id to existing tables if missing
        const migrate = (table) => {
            db.all(`PRAGMA table_info(${table})`, (err, columns) => {
                if (err) return;
                if (!columns.some(c => c.name === 'user_id')) {
                    db.run(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER DEFAULT 1`);
                }
            });
        };

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS gym_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                exercise TEXT,
                category TEXT,
                weight REAL,
                reps INTEGER,
                user_id INTEGER
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS body_weight (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                weight REAL,
                user_id INTEGER
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS gym_targets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise TEXT,
                target_weight REAL,
                user_id INTEGER
            )`);

            // Apply migrations for user_id to existing tables
            migrate('gym_entries');
            migrate('body_weight');
            migrate('gym_targets');

            // Create default user if not exists
            db.run(`INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, 'admin', 'admin')`);
        });
    }
});

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) return next();
    res.status(401).json({ error: 'Non authentifié' });
};


// API Routes
app.get('/api/gym', (req, res) => {
    db.all('SELECT * FROM gym_entries ORDER BY date DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/gym', (req, res) => {
    const { date, exercise, category, weight, reps } = req.body;
    db.run(
        `INSERT INTO gym_entries (date, exercise, category, weight, reps) VALUES (?, ?, ?, ?, ?)`,
        [date, exercise, category, weight, reps],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

// Weight Routes
app.get('/api/weight', (req, res) => {
    db.all('SELECT * FROM body_weight ORDER BY date ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/weight', (req, res) => {
    const { date, weight } = req.body;
    db.run(
        `INSERT INTO body_weight (date, weight) VALUES (?, ?)`,
        [date, weight],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username et password requis' });

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], function (err) {
            if (err) return res.status(400).json({ error: 'Pseudo déjà utilisé' });
            req.session.userId = this.lastID;
            res.json({ message: 'Inscription réussie', userId: this.lastID });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Identifiants incorrects' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Identifiants incorrects' });

        req.session.userId = user.id;
        res.json({ message: 'Connexion réussie', user: { id: user.id, username: user.username, profile_picture: user.profile_picture } });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    db.get(`SELECT id, username, profile_picture, accent_color, first_name, last_name, email, gender, height, age FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user) return res.json({ loggedIn: false });
        res.json({ loggedIn: true, user });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Déconnexion réussie' });
});

app.post('/api/user/upload-photo', requireAuth, upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier uploadé' });
    const photoUrl = `/uploads/${req.file.filename}`;
    db.run(`UPDATE users SET profile_picture = ? WHERE id = ?`, [photoUrl, req.session.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Photo mise à jour', photoUrl });
    });
});

app.post('/api/user/accent', requireAuth, (req, res) => {
    const { color } = req.body;
    if (!color) return res.status(400).json({ error: 'Couleur manquante' });
    db.run(`UPDATE users SET accent_color = ? WHERE id = ?`, [color, req.session.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Couleur mise à jour', color });
    });
});

app.post('/api/user/profile', requireAuth, (req, res) => {
    const { first_name, last_name, email, gender, height, age } = req.body;
    db.run(
        `UPDATE users SET first_name = ?, last_name = ?, email = ?, gender = ?, height = ?, age = ? WHERE id = ?`,
        [first_name, last_name, email, gender, height, age, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Profil mis à jour' });
        }
    );
});

// API Routes (Scoped to User)
app.get('/api/gym', requireAuth, (req, res) => {
    db.all('SELECT * FROM gym_entries WHERE user_id = ? ORDER BY date DESC', [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/gym', requireAuth, (req, res) => {
    const { date, exercise, category, weight, reps } = req.body;
    db.run(
        `INSERT INTO gym_entries (date, exercise, category, weight, reps, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [date, exercise, category, weight, reps, req.session.userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

// Weight Routes
app.get('/api/weight', requireAuth, (req, res) => {
    db.all('SELECT * FROM body_weight WHERE user_id = ? ORDER BY date ASC', [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/weight', requireAuth, (req, res) => {
    const { date, weight } = req.body;
    db.run(
        `INSERT INTO body_weight (date, weight, user_id) VALUES (?, ?, ?)`,
        [date, weight, req.session.userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

app.delete('/api/weight/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM body_weight WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.delete('/api/gym/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM gym_entries WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.post('/api/gym/import', requireAuth, (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Invalid data' });

    db.serialize(() => {
        const stmt = db.prepare('INSERT INTO gym_entries (date, exercise, category, weight, reps, user_id) VALUES (?, ?, ?, ?, ?, ?)');
        entries.forEach(e => stmt.run(e.date, e.exercise, e.category, e.weight, e.reps, req.session.userId));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Import successful', count: entries.length });
        });
    });
});

// Target Routes
app.get('/api/targets', requireAuth, (req, res) => {
    db.all('SELECT * FROM gym_targets WHERE user_id = ?', [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/targets', requireAuth, (req, res) => {
    const { exercise, target_weight } = req.body;
    db.run(
        `INSERT INTO gym_targets (exercise, target_weight, user_id) VALUES (?, ?, ?)`,
        [exercise, target_weight, req.session.userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

app.delete('/api/targets/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM gym_targets WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

// Dashboard Summary
app.get('/api/dashboard/summary', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const summary = {};

    db.get('SELECT weight, date FROM body_weight WHERE user_id = ? ORDER BY date DESC LIMIT 1', [userId], (err, row) => {
        summary.lastWeight = row ? row.weight : null;
        summary.lastWeightDate = row ? row.date : null;

        db.get('SELECT exercise, weight, reps, date FROM gym_entries WHERE user_id = ? ORDER BY date DESC LIMIT 1', [userId], (err, row) => {
            summary.lastWorkout = row ? row : null;

            db.get('SELECT COUNT(*) as count FROM gym_entries WHERE user_id = ?', [userId], (err, row) => {
                summary.totalWorkouts = row ? row.count : 0;

                db.get('SELECT MAX(target_weight) as max_target FROM gym_targets WHERE user_id = ?', [userId], (err, row) => {
                    summary.bestTarget = row ? row.max_target : 0;
                    res.json(summary);
                });
            });
        });
    });
});

// CSV Export
app.get('/api/gym/export', requireAuth, (req, res) => {
    db.all('SELECT date, exercise, category, weight, reps FROM gym_entries WHERE user_id = ? ORDER BY date DESC', [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const header = 'Date,Exercice,Categorie,Poids,Reps\n';
        const csv = rows.map(r => `${r.date},"${r.exercise}","${r.category || ''}",${r.weight},${r.reps}`).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=gym_history.csv');
        res.send(header + csv);
    });
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
