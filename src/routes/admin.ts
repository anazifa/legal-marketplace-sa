import express from 'express';
import { Pool } from 'pg';
import { isAdmin } from '../middleware/auth';
import { upload, errorHandler } from '../middleware/upload';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

const router = express.Router();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
});

// Middleware to check if user is admin
router.use(isAdmin);

// Validation schemas
const caseSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    client_id: z.string().uuid(),
    lawyer_id: z.string().uuid().optional(),
    practice_area: z.string().min(1).max(100),
    status: z.enum(['pending', 'active', 'completed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    deadline: z.string().datetime().optional(),
    budget_range: z.object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional()
    }).optional()
});

const paginationSchema = z.object({
    page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10)))
});

// Query timeout configuration
const QUERY_TIMEOUT = 5000; // 5 seconds

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Get Quick Stats
        const [
            activeFirms,
            activeClients,
            activeCases,
            monthlyRevenue,
            pendingCases,
            pendingPayments,
            newClients,
            newFirms
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2', ['lawyer', 'active']),
            pool.query('SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2', ['client', 'active']),
            pool.query('SELECT COUNT(*) FROM cases WHERE status = $1', ['active']),
            pool.query(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM payments
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `),
            pool.query('SELECT COUNT(*) FROM cases WHERE status = $1', ['pending']),
            pool.query('SELECT COUNT(*) FROM payments WHERE status = $1', ['pending']),
            pool.query(`
                SELECT COUNT(*) 
                FROM users 
                WHERE role = 'client' 
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `),
            pool.query(`
                SELECT COUNT(*) 
                FROM users 
                WHERE role = 'lawyer' 
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `)
        ]);

        // Get Recent Activity
        const recentActivity = await pool.query(`
            SELECT 
                CASE 
                    WHEN event_type = 'new_user' AND data->>'role' = 'client' THEN 'new_client'
                    WHEN event_type = 'new_user' AND data->>'role' = 'lawyer' THEN 'new_firm'
                    ELSE event_type
                END as type,
                message,
                created_at as timestamp
            FROM activity_log
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // Get Monthly Trends
        const monthlyTrends = await pool.query(`
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                months.month,
                COUNT(DISTINCT CASE WHEN u.role = 'client' THEN u.id END) as new_clients,
                COUNT(DISTINCT c.id) as new_cases,
                COALESCE(SUM(p.amount), 0) as revenue
            FROM months
            LEFT JOIN users u ON DATE_TRUNC('month', u.created_at) = months.month
            LEFT JOIN cases c ON DATE_TRUNC('month', c.created_at) = months.month
            LEFT JOIN payments p ON DATE_TRUNC('month', p.created_at) = months.month
            GROUP BY months.month
            ORDER BY months.month
        `);

        // Get Case Distribution
        const caseDistribution = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM cases
            GROUP BY status
        `);

        // Get System Alerts
        const systemAlerts = await pool.query(`
            SELECT 
                title,
                message,
                severity,
                created_at as timestamp
            FROM system_alerts
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY created_at DESC
        `);

        res.json({
            // Quick Stats
            activeFirms: parseInt(activeFirms.rows[0].count),
            activeClients: parseInt(activeClients.rows[0].count),
            activeCases: parseInt(activeCases.rows[0].count),
            monthlyRevenue: parseFloat(monthlyRevenue.rows[0].total),
            
            // Secondary Stats
            pendingCases: parseInt(pendingCases.rows[0].count),
            pendingPayments: parseInt(pendingPayments.rows[0].count),
            newClients: parseInt(newClients.rows[0].count),
            newFirms: parseInt(newFirms.rows[0].count),

            // Activity Feed
            recentActivity: recentActivity.rows,

            // Charts Data
            monthlyTrends: {
                labels: monthlyTrends.rows.map(row => 
                    new Date(row.month).toLocaleDateString('en-US', { month: 'short' })
                ),
                newClients: monthlyTrends.rows.map(row => parseInt(row.new_clients)),
                newCases: monthlyTrends.rows.map(row => parseInt(row.new_cases)),
                revenue: monthlyTrends.rows.map(row => parseFloat(row.revenue))
            },

            // Case Distribution
            caseDistribution: {
                labels: caseDistribution.rows.map(row => row.status),
                values: caseDistribution.rows.map(row => parseInt(row.count))
            },

            // System Alerts
            systemAlerts: systemAlerts.rows
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Users Management
router.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT u.*, up.location, up.rating, up.reviews_count
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/users', async (req, res) => {
    const { email, full_name, role, password } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, full_name, role, password] // In production, hash the password
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Projects Management
router.get('/projects', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT p.*, u.full_name as client_name
            FROM projects p
            JOIN users u ON p.client_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Categories Management
router.get('/categories', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT c.*, COUNT(s.id) as skills_count
            FROM categories c
            LEFT JOIN skills s ON c.id = s.category_id
            GROUP BY c.id
            ORDER BY c.name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/categories', async (req, res) => {
    const { name, description, parent_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO categories (name, description, parent_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description, parent_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Skills Management
router.get('/skills', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT s.*, c.name as category_name
            FROM skills s
            LEFT JOIN categories c ON s.category_id = c.id
            ORDER BY s.name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/skills', async (req, res) => {
    const { name, category_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO skills (name, category_id) VALUES ($1, $2) RETURNING *',
            [name, category_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reports
router.get('/reports', async (req, res) => {
    try {
        // Revenue Report (last 12 months)
        const revenue = await pool.query(`
            SELECT DATE_TRUNC('month', created_at) as month,
                   SUM(total_amount) as amount
            FROM contracts
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month ASC
        `);

        // User Activity (registrations per role)
        const userActivity = await pool.query(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        `);

        // Project Statistics
        const projectStats = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM projects
            GROUP BY status
        `);

        // Category Distribution
        const categoryDistribution = await pool.query(`
            SELECT c.name, COUNT(p.id) as count
            FROM categories c
            LEFT JOIN projects p ON c.id = p.category_id
            GROUP BY c.name
        `);

        res.json({
            revenue: {
                labels: revenue.rows.map(row => new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
                values: revenue.rows.map(row => parseFloat(row.amount) || 0)
            },
            userActivity: {
                labels: userActivity.rows.map(row => row.role),
                values: userActivity.rows.map(row => parseInt(row.count))
            },
            projectStats: {
                labels: projectStats.rows.map(row => row.status),
                values: projectStats.rows.map(row => parseInt(row.count))
            },
            categoryDistribution: {
                labels: categoryDistribution.rows.map(row => row.name),
                values: categoryDistribution.rows.map(row => parseInt(row.count))
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Case Management
router.get('/cases', async (req, res) => {
    try {
        // Validate pagination parameters
        const { page, limit } = paginationSchema.parse({
            page: req.query.page || '1',
            limit: req.query.limit || '10'
        });
        const offset = (page - 1) * limit;

        // Build the WHERE clause with parameterized queries
        const conditions = ['1=1'];
        const params: any[] = [];
        let paramCount = 1;

        if (req.query.status) {
            conditions.push(`c.status = $${paramCount}`);
            params.push(req.query.status);
            paramCount++;
        }

        if (req.query.practiceArea) {
            conditions.push(`c.practice_area = $${paramCount}`);
            params.push(req.query.practiceArea);
            paramCount++;
        }

        if (req.query.dateFrom) {
            conditions.push(`c.created_at >= $${paramCount}`);
            params.push(new Date(req.query.dateFrom as string));
            paramCount++;
        }

        if (req.query.dateTo) {
            conditions.push(`c.created_at <= $${paramCount}`);
            params.push(new Date(req.query.dateTo as string));
            paramCount++;
        }

        if (req.query.search) {
            conditions.push(`(
                c.title ILIKE $${paramCount} OR 
                c.description ILIKE $${paramCount} OR
                client.full_name ILIKE $${paramCount} OR
                lawyer.full_name ILIKE $${paramCount}
            )`);
            params.push(`%${req.query.search}%`);
            paramCount++;
        }

        // Get total count with timeout
        const countQuery = {
            text: `
                SELECT COUNT(*)
                FROM cases c
                LEFT JOIN users client ON c.client_id = client.id
                LEFT JOIN users lawyer ON c.lawyer_id = lawyer.id
                WHERE ${conditions.join(' AND ')}
            `,
            values: params,
            timeout: QUERY_TIMEOUT
        };
        const totalCount = await pool.query(countQuery);

        // Get cases with pagination and timeout
        const query = {
            text: `
                SELECT 
                    c.*,
                    client.full_name as client_name,
                    lawyer.full_name as lawyer_name
                FROM cases c
                LEFT JOIN users client ON c.client_id = client.id
                LEFT JOIN users lawyer ON c.lawyer_id = lawyer.id
                WHERE ${conditions.join(' AND ')}
                ORDER BY c.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `,
            values: [...params, limit, offset],
            timeout: QUERY_TIMEOUT
        };
        
        const { rows } = await pool.query(query);

        res.json({
            cases: rows,
            total: parseInt(totalCount.rows[0].count),
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching cases:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid parameters', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/cases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                c.*,
                client.full_name as client_name,
                lawyer.full_name as lawyer_name
            FROM cases c
            LEFT JOIN users client ON c.client_id = client.id
            LEFT JOIN users lawyer ON c.lawyer_id = lawyer.id
            WHERE c.id = $1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching case:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/cases', async (req, res) => {
    const client = await pool.connect();
    try {
        // Validate input
        const validatedData = caseSchema.parse(req.body);
        
        await client.query('BEGIN');

        // Insert case with timeout
        const query = {
            text: `
                INSERT INTO cases (
                    title,
                    description,
                    client_id,
                    lawyer_id,
                    practice_area,
                    status,
                    priority,
                    deadline,
                    budget_range
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `,
            values: [
                validatedData.title,
                validatedData.description,
                validatedData.client_id,
                validatedData.lawyer_id,
                validatedData.practice_area,
                validatedData.status,
                validatedData.priority,
                validatedData.deadline,
                validatedData.budget_range
            ],
            timeout: QUERY_TIMEOUT
        };

        const { rows: [newCase] } = await client.query(query);

        // Log activity
        await client.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'new_case',
            `New case created: ${validatedData.title}`,
            JSON.stringify({ case_id: newCase.id })
        ]);

        await client.query('COMMIT');
        res.status(201).json(newCase);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating case:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

router.put('/cases/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const {
            title,
            description,
            client_id,
            lawyer_id,
            practice_area,
            status,
            priority,
            deadline,
            budget_range
        } = req.body;

        // Update case
        const { rows: [updatedCase] } = await client.query(`
            UPDATE cases
            SET 
                title = $1,
                description = $2,
                client_id = $3,
                lawyer_id = $4,
                practice_area = $5,
                status = $6,
                priority = $7,
                deadline = $8,
                budget_range = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *
        `, [
            title,
            description,
            client_id,
            lawyer_id,
            practice_area,
            status,
            priority,
            deadline,
            budget_range,
            id
        ]);

        if (!updatedCase) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Log activity
        await client.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'case_updated',
            `Case updated: ${title}`,
            JSON.stringify({ case_id: id, changes: req.body })
        ]);

        await client.query('COMMIT');
        res.json(updatedCase);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating case:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

router.delete('/cases/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;

        // Get case details before deletion
        const { rows: [caseDetails] } = await client.query(
            'SELECT title FROM cases WHERE id = $1',
            [id]
        );

        if (!caseDetails) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Delete case
        await client.query('DELETE FROM cases WHERE id = $1', [id]);

        // Log activity
        await client.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'case_deleted',
            `Case deleted: ${caseDetails.title}`,
            JSON.stringify({ case_id: id })
        ]);

        await client.query('COMMIT');
        res.json({ message: 'Case deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting case:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Case Attachments
router.post('/cases/:id/attachments', upload.array('attachments', 5), errorHandler, async (req, res) => {
    const client = await pool.connect();
    let uploadedFiles: Express.Multer.File[] = [];
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        uploadedFiles = req.files as Express.Multer.File[];

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get current attachments
        const { rows: [currentCase] } = await client.query(
            'SELECT attachments FROM cases WHERE id = $1',
            [id]
        );

        if (!currentCase) {
            throw new Error('Case not found');
        }

        // Prepare new attachments
        const newAttachments = uploadedFiles.map(file => ({
            id: path.basename(file.filename, path.extname(file.filename)),
            name: file.originalname,
            path: file.path,
            size: file.size,
            type: file.mimetype,
            uploaded_at: new Date().toISOString()
        }));

        // Update attachments
        const updatedAttachments = [...(currentCase.attachments || []), ...newAttachments];
        const { rows: [updatedCase] } = await client.query(`
            UPDATE cases
            SET attachments = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [JSON.stringify(updatedAttachments), id]);

        // Log activity
        await client.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'attachments_added',
            `${uploadedFiles.length} attachment(s) added to case`,
            JSON.stringify({ case_id: id, new_attachments: newAttachments.map(a => a.name) })
        ]);

        await client.query('COMMIT');
        res.json(updatedCase);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding attachments:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
        // Clean up files on error
        if (res.statusCode === 500 && uploadedFiles.length) {
            await Promise.all(uploadedFiles.map(async file => {
                try {
                    if (existsSync(file.path)) {
                        await fs.unlink(file.path);
                    }
                } catch (error) {
                    console.error('Error cleaning up file:', error);
                }
            }));
        }
    }
});

router.delete('/cases/:caseId/attachments/:attachmentId', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { caseId, attachmentId } = req.params;

        // Get current attachments
        const { rows: [currentCase] } = await client.query(
            'SELECT attachments FROM cases WHERE id = $1',
            [caseId]
        );

        if (!currentCase) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Find attachment to remove
        const attachmentToRemove = currentCase.attachments.find(
            (attachment: any) => attachment.id === attachmentId
        );

        if (!attachmentToRemove) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Remove file from filesystem
        if (attachmentToRemove.path && existsSync(attachmentToRemove.path)) {
            await fs.unlink(attachmentToRemove.path);
        }

        // Remove attachment from case
        const updatedAttachments = currentCase.attachments.filter(
            (attachment: any) => attachment.id !== attachmentId
        );

        // Update case
        const { rows: [updatedCase] } = await client.query(`
            UPDATE cases
            SET attachments = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [JSON.stringify(updatedAttachments), caseId]);

        // Log activity
        await client.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'attachment_removed',
            `Attachment removed from case: ${attachmentToRemove.name}`,
            JSON.stringify({ case_id: caseId, attachment_id: attachmentId })
        ]);

        await client.query('COMMIT');
        res.json(updatedCase);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing attachment:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Practice Areas
router.get('/practice-areas', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT DISTINCT practice_area as name, practice_area as id
            FROM cases
            ORDER BY practice_area ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching practice areas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve files with security headers
router.get('/cases/:caseId/attachments/:attachmentId/download', async (req, res) => {
    try {
        const { caseId, attachmentId } = req.params;

        // Get case attachments
        const { rows: [currentCase] } = await pool.query(
            'SELECT attachments FROM cases WHERE id = $1',
            [caseId]
        );

        if (!currentCase) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Find attachment
        const attachment = currentCase.attachments.find(
            (a: any) => a.id === attachmentId
        );

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Check if file exists
        if (!attachment.path || !existsSync(attachment.path)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set security headers
        res.setHeader('Content-Type', attachment.type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.name)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Log download activity
        await pool.query(`
            INSERT INTO activity_log (
                event_type,
                message,
                data
            ) VALUES ($1, $2, $3)
        `, [
            'attachment_downloaded',
            `Attachment downloaded: ${attachment.name}`,
            JSON.stringify({ case_id: caseId, attachment_id: attachmentId })
        ]);

        // Stream file instead of loading it entirely into memory
        const fileStream = fs.createReadStream(attachment.path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 