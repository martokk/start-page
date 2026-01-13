const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res, next) => {
    next();
});

const pool = new Pool({
    host: process.env.STARTPAGE_POSTGRES_HOST || 'postgres',
    port: process.env.STARTPAGE_POSTGRES_PORT || 5432,
    user: process.env.STARTPAGE_POSTGRES_USER || 'startpage',
    password: process.env.STARTPAGE_POSTGRES_PASSWORD || 'startpage',
    database: process.env.STARTPAGE_POSTGRES_DB || 'startpage',
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_storage (
                key TEXT PRIMARY KEY,
                value JSONB
            );
        `);
        console.log('Database initialized: user_storage table ready');
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1); 
    }
}

app.get('/api/storage/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const result = await pool.query('SELECT value FROM user_storage WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            res.json(result.rows[0].value);
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error(`Error fetching key ${key}:`, err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/storage/:key', async (req, res) => {
    const { key } = req.params;
    const value = req.body;

    try {
        await pool.query(
            `INSERT INTO user_storage (key, value) 
             VALUES ($1, $2::jsonb) 
             ON CONFLICT (key) 
             DO UPDATE SET value = $2::jsonb`,
            [key, JSON.stringify(value)]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(`Error saving key ${key}:`, err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    setTimeout(initDB, 2000);
});
