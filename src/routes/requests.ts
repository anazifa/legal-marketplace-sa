import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { pool } from '../config/database';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/requests');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOC files are allowed.'));
        }
    }
});

// Validation schema for request creation
const requestSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    practiceArea: z.string().min(1, 'Practice area is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    location: z.string().min(1, 'Location is required'),
    budget: z.string().min(1, 'Budget range is required'),
    timeline: z.string().min(1, 'Timeline is required')
});

// Create a new request
router.post('/', isAuthenticated, upload.array('attachments', 5), async (req, res) => {
    try {
        // Validate request data
        const validatedData = requestSchema.parse(req.body);

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert request
            const requestResult = await client.query(
                `INSERT INTO legal_requests (
                    title, practice_area, description, location, 
                    budget_range, timeline, client_id, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                RETURNING id`,
                [
                    validatedData.title,
                    validatedData.practiceArea,
                    validatedData.description,
                    validatedData.location,
                    validatedData.budget,
                    validatedData.timeline,
                    req.user.id
                ]
            );

            const requestId = requestResult.rows[0].id;

            // Handle file attachments
            if (req.files && req.files.length > 0) {
                const fileValues = (req.files as Express.Multer.File[]).map(file => [
                    requestId,
                    file.originalname,
                    file.path,
                    file.mimetype,
                    file.size,
                    req.user.id
                ]);

                await client.query(
                    `INSERT INTO request_attachments (
                        request_id, file_name, file_path, file_type, 
                        file_size, uploaded_by
                    ) VALUES ${fileValues.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(', ')}`,
                    fileValues.flat()
                );
            }

            // Log activity
            await client.query(
                'INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)',
                [req.user.id, 'create_request', `Created legal request: ${validatedData.title}`]
            );

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Request created successfully',
                requestId
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all requests (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { practiceArea, location, status, page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT r.*, u.full_name as client_name, u.email as client_email
            FROM legal_requests r
            JOIN users u ON r.client_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (practiceArea) {
            query += ` AND r.practice_area = $${paramCount}`;
            params.push(practiceArea);
            paramCount++;
        }

        if (location) {
            query += ` AND r.location ILIKE $${paramCount}`;
            params.push(`%${location}%`);
            paramCount++;
        }

        if (status) {
            query += ` AND r.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        // Add pagination
        query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), offset);

        const result = await pool.query(query, params);

        res.json({
            requests: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get request by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const requestResult = await pool.query(
            `SELECT r.*, u.full_name as client_name, u.email as client_email
            FROM legal_requests r
            JOIN users u ON r.client_id = u.id
            WHERE r.id = $1`,
            [id]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Get attachments
        const attachmentsResult = await pool.query(
            'SELECT * FROM request_attachments WHERE request_id = $1',
            [id]
        );

        res.json({
            ...requestResult.rows[0],
            attachments: attachmentsResult.rows
        });
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router; 