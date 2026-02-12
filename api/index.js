import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Database Connection (Using Environment Variables for Vercel)
// Vercel doesn't support persistent connections well, but for low traffic pool works ok.
// IMPORTANT: You must set these ENV variables in Vercel Project Settings.
const db = mysql.createPool({
    host: process.env.DB_HOST?.trim(),
    user: process.env.DB_USER?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    port: parseInt(process.env.DB_PORT?.trim() || '3306'),
    waitForConnections: true,
    connectionLimit: 5, // Lower limit for serverless
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // Often needed for cloud DBs (Aiven/PlanetScale)
    }
});

// Helper: Promisify DB queries
const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// --- ROUTES ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, inviteCode } = req.body;

    try {
        const codes = await query('SELECT * FROM invite_codes WHERE code = ? AND (uses_left > 0 OR uses_left = -1)', [inviteCode]);
        if (codes.length === 0) return res.status(400).json({ message: 'Invalid or expired invite code' });

        const existing = await query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username or Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const avatarUrl = `https://ui-avatars.com/api/?name=${username}&background=333333&color=cccccc`;

        const result = await query(
            'INSERT INTO users (username, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, avatarUrl]
        );

        if (codes[0].uses_left !== -1) {
            await query('UPDATE invite_codes SET uses_left = uses_left - 1 WHERE code = ?', [inviteCode]);
        }

        const newUser = await query('SELECT uid, username, email, role, avatar_url as avatarUrl, avatar_color as avatarColor FROM users WHERE uid = ?', [result.insertId]);
        res.status(201).json(newUser[0]);

    } catch (err) {
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const users = await query('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        if (user.is_banned || user.role === 'Banned') return res.status(403).json({ message: 'You have been banned.' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const userObj = {
            uid: user.uid,
            username: user.username,
            email: user.email,
            role: user.role,
            registrationDate: user.registration_date,
            avatarUrl: user.avatar_url,
            avatarColor: user.avatar_color,
            location: user.location,
            website: user.website,
            about: user.about,
            dobDay: user.dob_day,
            dobMonth: user.dob_month,
            dobYear: user.dob_year,
            showDobDate: Boolean(user.show_dob_date),
            showDobYear: Boolean(user.show_dob_year),
            receiveEmails: Boolean(user.receive_emails),
            isBanned: Boolean(user.is_banned),
            isMuted: Boolean(user.is_muted)
        };
        res.json({ user: userObj, token: 'jwt-placeholder' });
    } catch (err) {
        res.status(500).json({ message: `Login error: ${err.message}` });
    }
});

// 3. Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await query('SELECT uid, username, email, role, avatar_url as avatarUrl, avatar_color as avatarColor, registration_date as registrationDate FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get User By ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const users = await query('SELECT * FROM users WHERE uid = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const u = users[0];
        const mapped = {
            uid: u.uid, username: u.username, email: u.email, role: u.role,
            registrationDate: u.registration_date, avatarUrl: u.avatar_url, avatarColor: u.avatar_color,
            location: u.location, website: u.website, about: u.about,
            dobDay: u.dob_day, dobMonth: u.dob_month, dobYear: u.dob_year,
            showDobDate: Boolean(u.show_dob_date), showDobYear: Boolean(u.show_dob_year),
            receiveEmails: Boolean(u.receive_emails), isBanned: Boolean(u.is_banned),
            isMuted: Boolean(u.is_muted), banReason: u.ban_reason
        };
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update Profile
app.put('/api/users/:uid', async (req, res) => {
    const uid = req.params.uid;
    const { avatarUrl, avatarColor, location, website, about, dobDay, dobMonth, dobYear, showDobDate, showDobYear, receiveEmails } = req.body;
    try {
        if (avatarUrl) await query('UPDATE users SET avatar_url = ? WHERE uid = ?', [avatarUrl, uid]);
        if (avatarColor) await query('UPDATE users SET avatar_color = ? WHERE uid = ?', [avatarColor, uid]);
        if (location !== undefined) await query('UPDATE users SET location = ?, website = ?, about = ?, dob_day = ?, dob_month = ?, dob_year = ?, show_dob_date = ?, show_dob_year = ?, receive_emails = ? WHERE uid = ?', [location, website, about, dobDay, dobMonth, dobYear, showDobDate, showDobYear, receiveEmails, uid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Get Shouts
app.get('/api/shouts', async (req, res) => {
    try {
        const sql = `SELECT s.id, s.message, s.time, u.uid, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor FROM shouts s JOIN users u ON s.uid = u.uid ORDER BY s.id DESC LIMIT 50`;
        const results = await query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Post Shout
app.post('/api/shouts', async (req, res) => {
    const { uid, message } = req.body;
    try {
        const userCheck = await query('SELECT role, is_banned, is_muted FROM users WHERE uid = ?', [uid]);
        if (userCheck.length > 0) {
            if (userCheck[0].is_banned || userCheck[0].role === 'Banned') return res.status(403).json({message: 'Banned'});
            if (userCheck[0].is_muted) return res.status(403).json({message: 'Muted'});
        }
        const result = await query('INSERT INTO shouts (uid, message) VALUES (?, ?)', [uid, message]);
        const newShout = await query(`SELECT s.id, s.message, s.time, u.uid, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor FROM shouts s JOIN users u ON s.uid = u.uid WHERE s.id = ?`, [result.insertId]);
        res.json(newShout[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Log IP
app.post('/api/users/:uid/ip', async (req, res) => {
    const { ip } = req.body;
    const uid = req.params.uid;
    try {
        const existing = await query('SELECT * FROM ip_logs WHERE uid = ? AND ip_address = ?', [uid, ip]);
        if (existing.length > 0) await query('UPDATE ip_logs SET count = count + 1, last_seen = NOW() WHERE id = ?', [existing[0].id]);
        else await query('INSERT INTO ip_logs (uid, ip_address) VALUES (?, ?)', [uid, ip]);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- ADMIN ROUTES ---
const verifyAdmin = async (req, res, next) => {
    const requesterUid = req.headers['x-admin-uid'];
    if (!requesterUid) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const users = await query('SELECT role FROM users WHERE uid = ?', [requesterUid]);
        if (users.length === 0 || users[0].role.toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        next();
    } catch (e) { res.status(500).json({ error: e.message }); }
};

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const users = await query('SELECT uid, username, email, role, registration_date, avatar_url, is_banned, is_muted, ban_reason FROM users ORDER BY uid DESC');
        const mapped = users.map(u => ({
            uid: u.uid, username: u.username, email: u.email, role: u.role,
            registrationDate: u.registration_date, avatarUrl: u.avatar_url,
            isBanned: Boolean(u.is_banned), isMuted: Boolean(u.is_muted), banReason: u.ban_reason
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:targetUid', verifyAdmin, async (req, res) => {
    const { role, isBanned, isMuted, banReason } = req.body;
    try {
        await query('UPDATE users SET role = ?, is_banned = ?, is_muted = ?, ban_reason = ? WHERE uid = ?', [role, isBanned ? 1 : 0, isMuted ? 1 : 0, banReason, req.params.targetUid]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Export the app for Vercel
export default app;