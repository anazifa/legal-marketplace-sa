-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    practice_area VARCHAR(100) NOT NULL,
    budget_range JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium',
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method JSONB,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- System Alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_roles TEXT[] DEFAULT '{}'::text[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_practice_area ON cases(practice_area);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_case_id ON payments(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 