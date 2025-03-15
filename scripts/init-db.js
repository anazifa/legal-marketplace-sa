require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);
        console.log('Database schema created successfully');

        // Insert initial data
        await insertInitialData(pool);
        console.log('Initial data inserted successfully');

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function insertInitialData(pool) {
    // Insert categories
    const categories = [
        { name: 'Corporate Law', description: 'Business and corporate legal services' },
        { name: 'Family Law', description: 'Legal services related to family matters' },
        { name: 'Criminal Law', description: 'Criminal defense and prosecution' },
        { name: 'Real Estate Law', description: 'Property and real estate legal services' },
        { name: 'Intellectual Property', description: 'Patents, trademarks, and copyrights' }
    ];

    for (const category of categories) {
        await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2)',
            [category.name, category.description]
        );
    }

    // Insert skills
    const skills = [
        'Contract Law',
        'Mergers & Acquisitions',
        'Divorce Law',
        'Child Custody',
        'Criminal Defense',
        'Property Law',
        'Patent Law',
        'Trademark Law',
        'Immigration Law',
        'Employment Law'
    ];

    for (const skill of skills) {
        await pool.query(
            'INSERT INTO skills (name) VALUES ($1)',
            [skill]
        );
    }

    // Create admin user
    const adminUser = {
        email: 'admin@legalmarketplace.sa',
        // Hash of 'admin123' - in production, use proper password hashing
        password_hash: '$2b$10$YourHashedPasswordHere',
        full_name: 'System Administrator',
        role: 'admin'
    };

    await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
        [adminUser.email, adminUser.password_hash, adminUser.full_name, adminUser.role]
    );
}

// Run initialization
initializeDatabase(); 