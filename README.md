# Legal Marketplace SA

A modern legal services marketplace platform for Saudi Arabia, connecting clients with qualified lawyers.

## 🌟 Features

- User authentication (Lawyers and Clients)
- Real-time bidding system
- Secure payment processing
- Multi-language support (English/Arabic)
- Role-based access control
- Escrow payment system

## 🚀 Deployment

### Using Docker (Recommended)

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Access the application at `http://localhost:8080`

To run in detached mode:
```bash
docker-compose up -d
```

To stop the containers:
```bash
docker-compose down
```

### GitHub Pages Deployment

This application is automatically deployed to GitHub Pages. You can view it at:
`https://[your-username].github.io/legal-marketplace-sa`

### Manual Deployment Steps

1. Fork this repository
2. Go to repository Settings > Pages
3. Set source to "GitHub Actions"
4. Push any change to the main branch to trigger deployment

## 🛠️ Development

### Prerequisites

- Node.js (v18+) and npm
- MongoDB
- Stripe account

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/legal-marketplace-sa.git
cd legal-marketplace-sa
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## 📦 Environment Variables

Create a `.env` file with:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
```

## 📊 Analytics Setup

The application uses Google Analytics 4 for tracking user interactions. To set up analytics:

1. Create a Google Analytics 4 property at [Google Analytics](https://analytics.google.com/)
2. Get your Measurement ID (starts with "G-")
3. Replace `G-XXXXXXXXXX` in `public/index.html` with your Measurement ID

Tracked Events:
- Login button clicks
- Find Lawyer button clicks
- Post Request button clicks

View your analytics data in the Google Analytics dashboard.

## 🔒 Security

- All sensitive data is stored in GitHub Secrets
- Authentication using JWT
- Secure payment processing with Stripe
- Data encryption in transit and at rest

## 📱 Features

### For Clients
- Post legal requests
- Browse lawyer profiles
- Real-time bidding
- Secure payments
- Rate lawyers

### For Lawyers
- Professional profiles
- Bid on requests
- Document management
- Payment tracking
- Client communication

## 🌐 API Documentation

Available endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/legal-requests` - List legal requests
- `POST /api/bids` - Place bid
- `POST /api/payments` - Process payment

## 📞 Support

For support, email [your-email@example.com]

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request 