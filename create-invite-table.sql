-- Create invite_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS invite_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    uses_left INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL
);

-- Insert a test invite code
INSERT INTO invite_codes (code, uses_left) VALUES ('TESTCODE123', 5);
