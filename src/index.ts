import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import lawyerRoutes from './routes/lawyers';
import requestRoutes from './routes/requests';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/requests', requestRoutes);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/find-lawyer', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/find-lawyer.html'));
});

app.get('/post-request', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/post-request.html'));
});

// New static page routes
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

app.get('/how-it-works', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/how-it-works.html'));
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pricing.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/contact.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/privacy.html'));
});

app.get('/cookies', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/cookies.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 