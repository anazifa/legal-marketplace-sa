import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
(async () => {
    try {
        await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Error creating uploads directory:', error);
        }
    }
})();

// Configure storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const caseId = req.params.id;
            
            // Validate caseId is a UUID
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId)) {
                return cb(new Error('Invalid case ID'), '');
            }

            // Sanitize the path
            const safeCaseId = path.normalize(caseId).replace(/^(\.\.(\/|\\|$))+/, '');
            const caseDir = path.join(uploadsDir, safeCaseId);
            
            try {
                await fs.mkdir(caseDir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    return cb(error, '');
                }
            }
            
            cb(null, caseDir);
        } catch (error) {
            cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        try {
            // Generate unique filename
            const uniqueId = uuidv4();
            const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
            const extension = path.extname(sanitizedName).toLowerCase();
            
            // Validate extension
            const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];
            if (!allowedExtensions.includes(extension)) {
                return cb(new Error('Invalid file extension'), '');
            }
            
            cb(null, `${uniqueId}${extension}`);
        } catch (error) {
            cb(error, '');
        }
    }
});

// Configure file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        // Allow common document types with specific mime types
        const allowedTypes = new Map([
            ['application/pdf', '.pdf'],
            ['application/msword', '.doc'],
            ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
            ['application/vnd.ms-excel', '.xls'],
            ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
            ['image/jpeg', '.jpg'],
            ['image/png', '.png'],
            ['text/plain', '.txt']
        ]);

        if (!allowedTypes.has(file.mimetype)) {
            return cb(new Error('Invalid file type'));
        }

        // Validate file extension matches mime type
        const expectedExt = allowedTypes.get(file.mimetype);
        const actualExt = path.extname(file.originalname).toLowerCase();
        if (actualExt !== expectedExt) {
            return cb(new Error('File extension does not match its content'));
        }

        cb(null, true);
    } catch (error) {
        cb(error);
    }
};

// Error handler
const errorHandler = (error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files' });
        }
    }
    if (error.message) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per upload
    }
});

export { upload, errorHandler }; 