-- CreateTable: crypto_wallet_keys (stores encrypted private keys separately)
CREATE TABLE IF NOT EXISTS crypto_wallet_keys (
    wallet_id VARCHAR(36) PRIMARY KEY,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMP,
    CONSTRAINT fk_wallet_keys_wallet 
        FOREIGN KEY (wallet_id) 
        REFERENCES crypto_wallets(id) 
        ON DELETE CASCADE
);

-- CreateTable: crypto_wallet_history (audit log for wallet rotations)
CREATE TABLE IF NOT EXISTS crypto_wallet_history (
    id SERIAL PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    old_address VARCHAR(100) NOT NULL,
    rotation_reason TEXT,
    rotated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wallet_history_wallet 
        FOREIGN KEY (wallet_id) 
        REFERENCES crypto_wallets(id) 
        ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_wallet_history_wallet_id ON crypto_wallet_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_rotated_at ON crypto_wallet_history(rotated_at);

-- Add comment
COMMENT ON TABLE crypto_wallet_keys IS 'Stores encrypted private keys for custodial wallets. CRITICAL SECURITY: Never expose these keys.';
COMMENT ON TABLE crypto_wallet_history IS 'Audit log for wallet address rotations (privacy & security).';
