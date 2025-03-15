# Legal Marketplace Admin Panel

A comprehensive admin panel for managing a legal marketplace platform. Built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Dashboard**
  - Real-time statistics and metrics
  - Activity monitoring
  - System alerts
  - Performance analytics

- **Case Management**
  - Create and manage legal cases
  - Assign lawyers to cases
  - Track case status and progress
  - File attachment support
  - Advanced filtering and search

- **User Management**
  - Manage lawyers and clients
  - User role management
  - Profile management
  - Activity tracking

- **Practice Areas**
  - Categorize legal services
  - Track case distribution
  - Manage specializations

- **Reports & Analytics**
  - Revenue tracking
  - User activity analysis
  - Case statistics
  - Custom report generation

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- TypeScript
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/legal-marketplace-admin.git
   cd legal-marketplace-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=legal_marketplace
   DB_PASSWORD=your_db_password
   DB_PORT=5432

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   MAX_FILE_SIZE=10485760 # 10MB
   UPLOAD_DIR=uploads
   ```

4. Initialize the database:
   ```bash
   npm run init-db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── src/
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── upload.ts
│   ├── routes/
│   │   └── admin.ts
│   ├── db/
│   │   └── schema.sql
│   └── index.ts
├── public/
│   └── admin/
│       ├── index.html
│       └── js/
│           └── admin.js
├── uploads/
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Cases
- `GET /api/admin/cases` - List all cases
- `POST /api/admin/cases` - Create a new case
- `GET /api/admin/cases/:id` - Get case details
- `PUT /api/admin/cases/:id` - Update case
- `DELETE /api/admin/cases/:id` - Delete case

### Case Attachments
- `POST /api/admin/cases/:id/attachments` - Upload attachments
- `GET /api/admin/cases/:caseId/attachments/:attachmentId/download` - Download attachment
- `DELETE /api/admin/cases/:caseId/attachments/:attachmentId` - Delete attachment

### Users
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user

### Practice Areas
- `GET /api/admin/practice-areas` - List practice areas

## Security Features

- JWT Authentication
- Role-based access control
- File upload validation
- SQL injection prevention
- XSS protection
- Rate limiting
- Security headers

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production mode
npm start

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@legalmarketplace.com or open an issue in the GitHub repository. 