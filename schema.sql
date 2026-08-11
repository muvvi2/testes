CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

INSERT INTO categories (name) VALUES
    ('Segurança Privada'), ('Garçom / Garçonete'), ('Cozinheiro(a) / Auxiliar'),
    ('Barista / Bartender'), ('Limpeza / Diarista'), ('Recepcionista / Portaria'),
    ('Promotor(a) de Eventos'), ('Suporte de TI / Infraestrutura'), ('Motoboy / Entregador'),
    ('Montador(a) de Palco / Roadie'), ('Fotógrafo(a) / Videomaker'), ('DJ / Sonoplasta'),
    ('Açougueiro(a)'), ('Padeiro(a)'), ('Confeiteiro(a)'), ('Pizzaiolo(a)'),
    ('Churrasqueiro(a)'), ('Balconista'), ('Operador(a) de Caixa'), ('Repositor(a) de Estoque')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'establishment', 'admin')) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    document_cpf VARCHAR(14) UNIQUE,
    document_cnpj VARCHAR(18) UNIQUE,
    whatsapp VARCHAR(20) NOT NULL,
    phone_contact VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    address_cep VARCHAR(9),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_neighborhood VARCHAR(100),
    address_complement VARCHAR(150),
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_ip VARCHAR(45),
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    terms_user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE vip_plans_freelancer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    max_categories INT NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    semestral_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    search_boost_level INT DEFAULT 0
);

INSERT INTO vip_plans_freelancer (name, max_categories, monthly_price, semestral_price, annual_price, search_boost_level) VALUES
    ('Free', 2, 0.00, 0.00, 0.00, 0),
    ('VIP 1', 4, 14.90, 59.90, 99.90, 1),
    ('VIP 2', 5, 24.90, 99.90, 169.90, 2),
    ('VIP 3', 999, 39.90, 159.90, 279.90, 3)
ON CONFLICT DO NOTHING;

CREATE TABLE vip_plans_establishment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    intermediation_fee_percentage DECIMAL(4,2) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    semestral_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL
);

INSERT INTO vip_plans_establishment (id, name, intermediation_fee_percentage, monthly_price, semestral_price, annual_price) VALUES
    (1, 'Plano Gratuito', 15.00, 0.00, 0.00, 0.00),
    (2, 'VIP 1', 7.50, 29.90, 149.00, 249.00),
    (3, 'VIP 2', 5.00, 59.90, 279.00, 479.00),
    (4, 'VIP 3 / Premium', 0.00, 119.90, 549.00, 949.00)
ON CONFLICT DO NOTHING;

CREATE TABLE freelancer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    vip_plan_id INT REFERENCES vip_plans_freelancer(id) DEFAULT 1,
    vip_expires_at TIMESTAMP WITH TIME ZONE,
    rating_average DECIMAL(3,2) DEFAULT 5.0,
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    core_bank_account_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE establishment_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_description TEXT,
    vip_plan_id INT REFERENCES vip_plans_establishment(id) DEFAULT 1,
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    vip_expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE freelancer_categories (
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (freelancer_id, category_id)
);

CREATE TABLE freelancer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    shift_morning BOOLEAN DEFAULT FALSE,
    shift_afternoon BOOLEAN DEFAULT FALSE,
    shift_night BOOLEAN DEFAULT FALSE,
    UNIQUE(freelancer_id, day_of_week)
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    freelancer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    contract_date DATE NOT NULL,
    shifts_contracted VARCHAR(50) NOT NULL,
    total_freelancer_value DECIMAL(10,2) NOT NULL,
    platform_fee_percentage DECIMAL(4,2) NOT NULL,
    platform_fee_value DECIMAL(10,2) NOT NULL,
    total_amount_paid DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) CHECK (status IN ('pending_admin_check', 'approved_by_admin', 'accepted_by_freela','paid_escrow', 'check_in_done', 'completed_split', 'canceled')) DEFAULT 'pending_admin_check',
    cora_invoice_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE discount_coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action_performed TEXT NOT NULL,
    target_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE OR REPLACE FUNCTION calculate_contract_fees()
RETURNS TRIGGER AS $$
DECLARE
    v_fee_pct DECIMAL(4,2);
BEGIN
    SELECT vpe.intermediation_fee_percentage
    INTO v_fee_pct
    FROM establishment_profiles ep
    JOIN vip_plans_establishment vpe ON ep.vip_plan_id = vpe.id
    WHERE ep.user_id = NEW.establishment_id;

    NEW.platform_fee_percentage := COALESCE(v_fee_pct, 15.00);
    NEW.platform_fee_value := ROUND((NEW.total_freelancer_value * (NEW.platform_fee_percentage / 100)), 2);
    NEW.total_amount_paid := NEW.total_freelancer_value + NEW.platform_fee_value;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calculate_contract_fees
BEFORE INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION calculate_contract_fees();
