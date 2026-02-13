
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
        res.status(500).json({ status: 'error', error: e.message });
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
        permissions: {
            canMute: user.role === 'Admin' || user.role === 'Moderator' || Boolean(user.can_mute),
            canBan: user.role === 'Admin' || Boolean(user.can_ban),
            canDeleteShouts: user.role === 'Admin' || user.role === 'Moderator' || Boolean(user.can_delete_shouts)
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
        res.status(500).json({ error: err.message });
    }
});

// 4. Get User By ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await query('SELECT * FROM users WHERE uid = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        res.json(mapUserFromDb(users[0]));
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        const role = user.role?.toLowerCase() || '';
        const hasDeletePermission = user.can_delete_shouts == 1;
        const isAuthorized = role === 'admin' || role === 'moderator' || hasDeletePermission;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }
        
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
    } catch (e) { res.status(500).json({ error: e.message }); }
};

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const [users] = await query('SELECT uid, username, email, role, registration_date, avatar_url, is_banned, is_muted, ban_reason FROM users ORDER BY uid DESC');
        const mapped = users.map(u => ({
            uid: u.uid, username: u.username, email: u.email, role: u.role,
            registrationDate: u.registration_date, avatarUrl: u.avatar_url,
            isBanned: Boolean(u.is_banned), isMuted: Boolean(u.is_muted), banReason: u.ban_reason
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:targetUid', verifyAdmin, async (req, res) => {
    const { role, isBanned, isMuted, banReason, permissions } = req.body;
    try {
        await query(
            'UPDATE users SET role = ?, is_banned = ?, is_muted = ?, ban_reason = ?, can_mute = ?, can_ban = ?, can_delete_shouts = ? WHERE uid = ?', 
            [
                role, 
                isBanned ? 1 : 0, 
                isMuted ? 1 : 0, 
                banReason,
                permissions?.canMute ? 1 : 0,
                permissions?.canBan ? 1 : 0,
                permissions?.canDeleteShouts ? 1 : 0,
                req.params.targetUid
            ]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
        // Add expires_at column if it doesn't exist for backward compatibility
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
    } catch (err) { res.status(500).json({ error: err.message }); }
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
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/admin/invite-codes/:id', verifyAdmin, async (req, res) => {
    try {
        await query('DELETE FROM invite_codes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- FORUM ROUTES ---

// Get all forums, grouped by category
app.get('/api/forums', async (req, res) => {
    try {
        const sql = `
            SELECT 
                f.*,
                t.id as last_post_thread_id,
                t.title as last_post_thread_title,
                p.created_at as last_post_time,
                u.uid as last_post_user_uid,
                u.username as last_post_username,
                u.role as last_post_user_role
            FROM forums f
            LEFT JOIN posts p ON f.last_post_id = p.id
            LEFT JOIN threads t ON p.thread_id = t.id
            LEFT JOIN users u ON p.uid = u.uid
            ORDER BY f.category, f.display_order;
        `;
        const [forums] = await query(sql);
        const grouped = forums.reduce((acc, forum) => {
            const category = forum.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(forum);
            return acc;
        }, {});

        const result = Object.keys(grouped).map(key => ({
            category: key,
            forums: grouped[key]
        }));
        
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get threads for a specific forum
app.get('/api/forums/:forumId/threads', async (req, res) => {
    const { forumId } = req.params;
    try {
        const [forums] = await query('SELECT * FROM forums WHERE id = ?', [forumId]);
        if (forums.length === 0) return res.status(404).json({ message: 'Forum not found' });

        const sql = `
            SELECT 
                t.*,
                author.username as author_username,
                author.role as author_role,
                author.avatar_url as author_avatar_url,
                author.avatar_color as author_avatar_color,
                last_poster.uid as last_post_uid,
                last_poster.username as last_post_username,
                last_poster.role as last_post_role
            FROM threads t
            JOIN users author ON t.author_uid = author.uid
            JOIN users last_poster ON t.last_post_uid = last_poster.uid
            WHERE t.forum_id = ?
            ORDER BY t.is_pinned DESC, t.last_post_time DESC
        `;
        const [threads] = await query(sql, [forumId]);
        res.json({ forum: forums[0], threads });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Get a single thread with its posts
app.get('/api/threads/:threadId', async (req, res) => {
    const { threadId } = req.params;
    try {
        const [threads] = await query('SELECT * FROM threads WHERE id = ?', [threadId]);
        if (threads.length === 0) return res.status(404).json({ message: 'Thread not found' });

        const postsSql = `
            SELECT p.*, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor, u.registration_date as registrationDate,
            (SELECT COUNT(*) FROM posts WHERE uid = u.uid) as post_count
            FROM posts p
            JOIN users u ON p.uid = u.uid
            WHERE p.thread_id = ?
            ORDER BY p.created_at ASC
        `;
        const [posts] = await query(postsSql, [threadId]);
        res.json({ thread: threads[0], posts });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
    const { uid, forumId, title, content } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const now = new Date();
        const threadSql = 'INSERT INTO threads (forum_id, title, author_uid, last_post_time, last_post_uid) VALUES (?, ?, ?, ?, ?)';
        const [threadResult] = await connection.query(threadSql, [forumId, title, uid, now, uid]);
        const threadId = threadResult.insertId;

        const postSql = 'INSERT INTO posts (thread_id, uid, content, created_at) VALUES (?, ?, ?, ?)';
        const [postResult] = await connection.query(postSql, [threadId, uid, content, now]);
        const postId = postResult.insertId;

        await connection.query('UPDATE forums SET thread_count = thread_count + 1, post_count = post_count + 1, last_post_id = ? WHERE id = ?', [postId, forumId]);
        await connection.query('UPDATE users SET post_count = post_count + 1 WHERE uid = ?', [uid]);

        await connection.commit();
        const [newThread] = await query('SELECT * FROM threads WHERE id = ?', [threadId]);
        res.status(201).json(newThread[0]);
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
});

// Create a new post (reply)
app.post('/api/posts', async (req, res) => {
    const { uid, threadId, content } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const now = new Date();

        const postSql = 'INSERT INTO posts (thread_id, uid, content, created_at) VALUES (?, ?, ?, ?)';
        const [postResult] = await connection.query(postSql, [threadId, uid, content, now]);
        const postId = postResult.insertId;

        await connection.query('UPDATE threads SET reply_count = reply_count + 1, last_post_time = ?, last_post_uid = ? WHERE id = ?', [now, uid, threadId]);
        const [threadInfo] = await connection.query('SELECT forum_id FROM threads WHERE id = ?', [threadId]);
        await connection.query('UPDATE forums SET post_count = post_count + 1, last_post_id = ? WHERE id = ?', [postId, threadInfo[0].forum_id]);
        await connection.query('UPDATE users SET post_count = post_count + 1 WHERE uid = ?', [uid]);

        await connection.commit();
        
        const [newPost] = await query(`
             SELECT p.*, u.username, u.role, u.avatar_url as avatarUrl, u.avatar_color as avatarColor, u.registration_date as registrationDate
             FROM posts p JOIN users u ON p.uid = u.uid WHERE p.id = ?
        `, [postId]);
        res.status(201).json(newPost[0]);
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
});


// Export the app for Vercel
export default app;
