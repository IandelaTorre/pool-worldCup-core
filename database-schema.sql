-- ============================================
-- QUINIELA MUNDIAL - Database Schema
-- PostgreSQL Query
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE match_status AS ENUM ('pending', 'in_progress', 'finished');
CREATE TYPE member_role AS ENUM ('admin', 'member');

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CATALOG USER ROLES
-- ============================================

CREATE TABLE catalog_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER ROLES (Many-to-Many)
-- ============================================

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES catalog_user_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================
-- GROUPS
-- ============================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(10) NOT NULL UNIQUE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    max_members INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- GROUP MEMBERS
-- ============================================

CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- ============================================
-- SCORING RULE TYPES (Catalog)
-- ============================================

CREATE TABLE scoring_rule_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_points INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- GROUP SCORING CONFIGURATION
-- ============================================

CREATE TABLE group_scoring_config (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    rule_type_id UUID NOT NULL REFERENCES scoring_rule_types(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (group_id, rule_type_id)
);

-- ============================================
-- MATCHES
-- ============================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_number INTEGER NOT NULL UNIQUE,
    group_name CHAR(1) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'group',
    team_home VARCHAR(50) NOT NULL,
    team_home_iso2 VARCHAR(10),
    team_home_name_en VARCHAR(50),
    team_home_flag_url VARCHAR(255),
    team_away VARCHAR(50) NOT NULL,
    team_away_iso2 VARCHAR(10),
    team_away_name_en VARCHAR(50),
    team_away_flag_url VARCHAR(255),
    match_date TIMESTAMP NOT NULL,
    venue VARCHAR(100),
    city VARCHAR(100),
    country_host VARCHAR(100),
    score_home INTEGER,
    score_away INTEGER,
    status match_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PREDICTIONS
-- ============================================

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    prediction_home INTEGER NOT NULL,
    prediction_away INTEGER NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_id, group_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_scoring_rule_types_code ON scoring_rule_types(code);
CREATE INDEX idx_group_scoring_config_group_id ON group_scoring_config(group_id);
CREATE INDEX idx_matches_group_name ON matches(group_name);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_predictions_group_id ON predictions(group_id);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- User roles
INSERT INTO catalog_user_roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('player', 'Regular player who can make predictions');

-- Scoring rule types
INSERT INTO scoring_rule_types (code, name, description, default_points) VALUES
    ('exact_score', 'Exact Score', 'Correctly predict the exact final score', 3),
    ('winner', 'Winner/Draw', 'Correctly predict which team wins or if its a draw', 1),
    ('goal_difference', 'Goal Difference', 'Correctly predict the goal difference', 1),
    ('team_goals', 'Team Goals', 'Correctly predict the number of goals for one team', 1);
