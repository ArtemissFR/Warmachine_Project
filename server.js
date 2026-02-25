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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database opening error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS gym_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            exercise TEXT,
            category TEXT,
            weight REAL,
            reps INTEGER
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS body_weight (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            weight REAL
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS gym_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise TEXT,
            target_weight REAL
        )`);
    }
});

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

app.delete('/api/weight/:id', (req, res) => {
    db.run('DELETE FROM body_weight WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.delete('/api/gym/:id', (req, res) => {
    db.run('DELETE FROM gym_entries WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.post('/api/gym/import', (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Invalid data' });

    db.serialize(() => {
        db.run('DELETE FROM gym_entries'); // Clean start for import? Or append?
        const stmt = db.prepare('INSERT INTO gym_entries (date, exercise, category, weight, reps) VALUES (?, ?, ?, ?, ?)');
        entries.forEach(e => stmt.run(e.date, e.exercise, e.category, e.weight, e.reps));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Import successful', count: entries.length });
        });
    });
});

// Target Routes
app.get('/api/targets', (req, res) => {
    db.all('SELECT * FROM gym_targets', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/targets', (req, res) => {
    const { exercise, target_weight } = req.body;
    db.run(
        `INSERT INTO gym_targets (exercise, target_weight) VALUES (?, ?)`,
        [exercise, target_weight],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

app.delete('/api/targets/:id', (req, res) => {
    db.run('DELETE FROM gym_targets WHERE id = ?', req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

// Serve frontend for any non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
