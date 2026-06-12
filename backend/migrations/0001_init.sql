-- Reusable updated_on trigger function
CREATE OR REPLACE FUNCTION update_updated_on_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_on = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_on TIMESTAMP NOT NULL DEFAULT now(),
    updated_on TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. gigs Table
CREATE TABLE gigs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget_amount INTEGER NOT NULL, -- in cents
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('online', 'offline')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'closed')),
    posted_by INTEGER NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT now(),
    updated_on TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. saved_gigs Table (the feature)
CREATE TABLE saved_gigs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    gig_id INTEGER NOT NULL,
    list VARCHAR(50) NOT NULL DEFAULT 'WATCHLIST' CHECK (list IN ('WATCHLIST', 'APPLY_LATER', 'SHORTLIST')),
    note VARCHAR(280) DEFAULT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT now(),
    updated_on TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    UNIQUE (user_id, gig_id)
);

-- Create triggers to update updated_on
CREATE TRIGGER update_users_updated_on
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_on_column();

CREATE TRIGGER update_gigs_updated_on
    BEFORE UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_on_column();

CREATE TRIGGER update_saved_gigs_updated_on
    BEFORE UPDATE ON saved_gigs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_on_column();

-- Create optimization indexes
CREATE INDEX idx_gigs_posted_by ON gigs(posted_by);
CREATE INDEX idx_saved_gigs_gig_id ON saved_gigs(gig_id);
CREATE INDEX idx_saved_gigs_user_list ON saved_gigs(user_id, list);
