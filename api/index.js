
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
    database: process.env.DB_NAME?.trim().replace(/"/g, ''),
    port: Number(process.env.DB_PORT) || 16586,
    waitForConnections: true,
    connectionLimit: 5, // Lower limit for serverless
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // Often needed for cloud DBs (Aiven/PlanetScale)
    }
}).promise();

// Helper: Promisify DB queries
const query = (sql, values) => db.query(sql, values);


// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// --- ROUTES ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, inviteCode } = req.body;

    try {
        const [codes] = await query('SELECT * FROM invite_codes WHERE code = ? AND (uses_left > 0 OR uses_left = -1)', [inviteCode]);
        if (codes.length === 0) return res.status(400).json({ message: 'Invalid or expired invite code' });
        
        // Check expiration
        if (codes[0].expires_at && new Date(codes[0].expires_at) < new Date()) {
            return res.status(400).json({ message: 'Invite code has expired' });
        }

        const [existing] = await query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username or Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const avatarUrl = `https://ui-avatars.com/api/?name=${username}&background=333333&color=cccccc`;

        const [result] = await query(
            'INSERT INTO users (username, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, avatarUrl]
        );

        if (codes[0].uses_left !== -1) {
            await query('UPDATE invite_codes SET uses_left = uses_left - 1 WHERE code = ?', [inviteCode]);
        }

        const [newUser] = await query('SELECT uid, username, email, role, avatar_url as avatarUrl, avatar_color as avatarColor FROM users WHERE uid = ?', [result.insertId]);
        res.status(201).json(newUser[0]);

    } catch (err) {
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
});

const mapUserFromDb = (user) => {
    if (!user) return null;
    return {
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
        isMuted: Boolean(user.is_muted),
        banReason: user.ban_reason,
        priority: user.priority,
        permissions: {
            canMute: Boolean(user.can_mute),
            canBan: Boolean(user.can_ban),
            canDeleteShouts: Boolean(user.can_delete_shouts)
        }
    };
};


// 2. Login
app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const [users] = await query('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        if (user.is_banned || user.role === 'Banned') return res.status(403).json({ message: 'You have been banned.' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        res.json({ user: mapUserFromDb(user), token: 'jwt-placeholder' });
    } catch (err) {
        res.status(500).json({ message: `Login error: ${err.message}` });
    }
});

// 3. Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await query('SELECT * FROM users');
        res.json(users.map(mapUserFromDb));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Get User By ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await query('SELECT * FROM users WHERE uid = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        res.json(mapUserFromDb(users[0]));
    } catch (err) {
        res.status(500).json({ message: err.message });
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

// Password Change Endpoint
app.put('/api/users/:uid/password', async (req, res) => {
    const { uid } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required.' });
    }

    try {
        const [users] = await query('SELECT password_hash FROM users WHERE uid = ?', [uid]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];
        const match = await bcrypt.compare(oldPassword, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Incorrect existing password.' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password_hash = ? WHERE uid = ?', [newHashedPassword, uid]);
        res.json({ success: true, message: 'Password updated successfully.' });

    } catch (err) {
        console.error("Password Change Error:", err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
});


// 6. Get Shouts
app.get('/api/shouts', async (req, res) => {
    try {
        const sql = `SELECT s.id, s.message, s.time, u.uid, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor FROM shouts s JOIN users u ON s.uid = u.uid ORDER BY s.id DESC LIMIT 50`;
        const [results] = await query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Post Shout
app.post('/api/shouts', async (req, res) => {
    const { uid, message } = req.body;
    try {
        const [userCheck] = await query('SELECT role, is_banned, is_muted FROM users WHERE uid = ?', [uid]);
        if (userCheck.length > 0) {
            if (userCheck[0].is_banned || userCheck[0].role === 'Banned') return res.status(403).json({message: 'Banned'});
            if (userCheck[0].is_muted) return res.status(403).json({message: 'Muted'});
        }
        const [result] = await query('INSERT INTO shouts (uid, message) VALUES (?, ?)', [uid, message]);
        const [newShout] = await query(`SELECT s.id, s.message, s.time, u.uid, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor FROM shouts s JOIN users u ON s.uid = u.uid WHERE s.id = ?`, [result.insertId]);
        res.json(newShout[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. Log IP
app.post('/api/users/:uid/ip', async (req, res) => {
    const { ip } = req.body;
    const uid = req.params.uid;
    try {
        const [existing] = await query('SELECT * FROM ip_logs WHERE uid = ? AND ip_address = ?', [uid, ip]);
        if (existing.length > 0) await query('UPDATE ip_logs SET count = count + 1, last_seen = NOW() WHERE id = ?', [existing[0].id]);
        else await query('INSERT INTO ip_logs (uid, ip_address) VALUES (?, ?)', [uid, ip]);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- MODERATION ---
const verifyModeratorOrAdmin = async (req, res, next) => {
    const requesterUid = req.headers['x-user-uid'];
    if (!requesterUid) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const [users] = await query('SELECT role, can_delete_shouts FROM users WHERE uid = ?', [requesterUid]);
        if (users.length === 0) return res.status(403).json({ message: 'Forbidden: User not found' });
        
        const user = users[0];
        const canDelete = user.role.toLowerCase() === 'admin' || user.can_delete_shouts;

        if (!canDelete) return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        
        next();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

app.delete('/api/shouts/:shoutId', verifyModeratorOrAdmin, async (req, res) => {
    const { shoutId } = req.params;
    try {
        await query('DELETE FROM shouts WHERE id = ?', [shoutId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- ADMIN ROUTES ---
const verifyAdmin = async (req, res, next) => {
    const requesterUid = req.headers['x-admin-uid'];
    if (!requesterUid) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const [users] = await query('SELECT role FROM users WHERE uid = ?', [requesterUid]);
        if (users.length === 0 || users[0].role.toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        next();
    } catch (e) { res.status(500).json({ message: e.message }); }
};

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        await ensureUserColumns();
        const [users] = await query('SELECT * FROM users ORDER BY uid DESC');
        res.json(users.map(mapUserFromDb));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/users/:targetUid', verifyAdmin, async (req, res) => {
    const { role, isBanned, isMuted, banReason, permissions } = req.body;
    const targetUid = req.params.targetUid;

    try {
        await ensureUserColumns();
        
        // Any admin can edit any user

        if (!permissions) {
             return res.status(400).json({ message: "Permissions object is missing." });
        }

        // Single, atomic update for all fields
        await query(
            'UPDATE users SET role = ?, is_banned = ?, is_muted = ?, ban_reason = ?, can_mute = ?, can_ban = ?, can_delete_shouts = ? WHERE uid = ?', 
            [
                role, 
                isBanned ? 1 : 0, 
                isMuted ? 1 : 0, 
                banReason, 
                permissions.canMute ? 1 : 0, 
                permissions.canBan ? 1 : 0, 
                permissions.canDeleteShouts ? 1 : 0, 
                targetUid
            ]
        );
        res.json({ success: true });
    } catch (err) { 
        console.error(`ADMIN USER UPDATE FAILED for target UID ${targetUid}:`, err);
        res.status(500).json({ message: err.message || 'An unknown server error occurred.' });
    }
});

const ensureUserColumns = async () => {
    try {
        // Add priority column if not exists
        try {
            await query("ALTER TABLE users ADD COLUMN priority INT DEFAULT 0");
        } catch (e) { /* ignore */ }
        
        // Add permission columns if not exist
        try {
            await query("ALTER TABLE users ADD COLUMN can_mute TINYINT(1) DEFAULT 0");
        } catch (e) { /* ignore */ }
        try {
            await query("ALTER TABLE users ADD COLUMN can_ban TINYINT(1) DEFAULT 0");
        } catch (e) { /* ignore */ }
        try {
            await query("ALTER TABLE users ADD COLUMN can_delete_shouts TINYINT(1) DEFAULT 0");
        } catch (e) { /* ignore */ }
    } catch (err) {
        console.log('Error ensuring user columns:', err.message);
    }
};

const ensureInviteCodeTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS invite_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                uses_left INT NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NULL
            )
        `);
        const [columns] = await query(
            "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invite_codes' AND COLUMN_NAME = 'expires_at'"
        );
        if (columns.length === 0) {
            await query("ALTER TABLE invite_codes ADD COLUMN expires_at DATETIME NULL");
        }
    } catch (tableErr) {
        console.log('Error ensuring invite_codes table:', tableErr.message);
    }
};

// Invite Codes Admin
app.get('/api/admin/invite-codes', verifyAdmin, async (req, res) => {
    try {
        await ensureInviteCodeTable();
        const [codes] = await query('SELECT * FROM invite_codes ORDER BY id DESC');
        res.json(codes);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/invite-codes', verifyAdmin, async (req, res) => {
    const { code, usesLeft, expiresAt } = req.body;
    try {
        await ensureInviteCodeTable();
        
        if (expiresAt) {
            await query('INSERT INTO invite_codes (code, uses_left, expires_at) VALUES (?, ?, ?)', [code, usesLeft, expiresAt]);
        } else {
            await query('INSERT INTO invite_codes (code, uses_left) VALUES (?, ?)', [code, usesLeft]);
        }
        res.json({ success: true });
    } catch (err) { 
        console.error('Create invite code error:', err);
        res.status(500).json({ message: err.message }); 
    }
});

app.delete('/api/admin/invite-codes/:id', verifyAdmin, async (req, res) => {
    try {
        await query('DELETE FROM invite_codes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Export the app for Vercel
export default app;
