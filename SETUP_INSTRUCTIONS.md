# Landlord Rental Management Dashboard - Setup Instructions

## Overview
This is a comprehensive landlord rental management system built with Next.js, Prisma, MongoDB, NextAuth, Nodemailer, and Cloudinary.

## Prerequisites
- Node.js 18+ and npm/pnpm
- MongoDB Atlas account (or local MongoDB)
- Gmail account (for Nodemailer email sending)
- Cloudinary account (for image/file storage)

## Step 1: Database Setup (MongoDB)

### Option A: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user and whitelist your IP
4. Copy the connection string
5. Replace `<username>`, `<password>`, and `<cluster>` in your connection string

### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `mongodb://localhost:27017/landlord_db`

## Step 2: Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/landlord_db?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
# Generate with: openssl rand -hex 32

# Email Configuration (Gmail with App Password)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@yourdomain.com"

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Step 3: NextAuth Secret

Generate a secret key:
```bash
openssl rand -hex 32
```

Use this value for `NEXTAUTH_SECRET` in your `.env.local` file.

## Step 4: Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security > App passwords
   - Select Mail and Windows Computer
   - Copy the 16-character password
3. Use this 16-character password as `EMAIL_PASSWORD` in `.env.local`

## Step 5: Cloudinary Setup

1. Create a [Cloudinary](https://cloudinary.com) account
2. Go to Dashboard
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret
4. Add these to `.env.local`

## Step 6: Install Dependencies

```bash
pnpm install
```

## Step 7: Initialize Prisma Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Create database schema
pnpm prisma db push

# (Optional) Seed database with sample data
pnpm prisma db seed
```

## Step 8: Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Step 9: First Login

1. Navigate to `http://localhost:3000/auth/signup`
2. Create your landlord account
3. You'll be redirected to the dashboard

## Features

### Properties
- Add and manage multiple rental properties
- Track property details (address, bedrooms, bathrooms, etc.)
- Upload property images
- View property statistics

### Tenants
- Add and manage tenants
- Track lease dates and rent amounts
- Emergency contact information
- Tenant status (active/inactive/evicted)

### Rent Payments
- Record and track rent payments
- Monitor payment status (pending/paid/late/overdue)
- Payment history by property or tenant
- Send automated payment reminders

### Maintenance
- Create and track maintenance requests
- Categorize by type (plumbing, electrical, HVAC, etc.)
- Set priority levels
- Track costs and completion dates
- Upload maintenance images

### Documents
- Store lease agreements
- Keep insurance documents
- Tax records
- Inspection reports
- File organization by property

### Communications
- Send emails to tenants
- Track communication history
- Automated email templates for:
  - Rent payment reminders
  - Payment confirmations
  - Maintenance request acknowledgments
  - Lease expiration notices

### Automated Features
- Email notifications for rent payments
- Maintenance request status updates
- Lease expiration reminders
- Payment status tracking

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `GET /api/properties/[id]` - Get property details
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property

### Tenants
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/[id]` - Get tenant details
- `PUT /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant

### Rent Payments
- `GET /api/rent-payments` - List payments
- `POST /api/rent-payments` - Create payment
- `GET /api/rent-payments/[id]` - Get payment details
- `PUT /api/rent-payments/[id]` - Update payment
- `DELETE /api/rent-payments/[id]` - Delete payment

### Maintenance
- `GET /api/maintenance` - List requests
- `POST /api/maintenance` - Create request
- `GET /api/maintenance/[id]` - Get request details
- `PUT /api/maintenance/[id]` - Update request
- `DELETE /api/maintenance/[id]` - Delete request

### Communications
- `GET /api/communications/send-email` - List communications
- `POST /api/communications/send-email` - Send email
- `POST /api/communications/send-rent-notice` - Send rent notice

## Database Schema

### Core Models
- **User** - Landlord account information
- **Property** - Rental property details
- **Tenant** - Tenant information
- **RentPayment** - Rent payment tracking
- **MaintenanceRequest** - Maintenance work orders
- **MaintenanceSchedule** - Recurring maintenance
- **Document** - File storage references
- **Communication** - Email logs

## Development Tips

### Creating New Features
1. Define Prisma model in `prisma/schema.prisma`
2. Run `pnpm prisma db push`
3. Create API route in `app/api/[feature]/route.ts`
4. Add UI component in `app/dashboard/[feature]/page.tsx`

### Database Queries
All database queries are wrapped with authentication checks. Always verify `session.user.id` before querying.

### Email Testing
Check the console logs when running `pnpm dev` to see email sending status. In production, configure SMTP properly.

## Troubleshooting

### Database Connection Issues
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Ensure `DATABASE_URL` is correctly set in `.env.local`

### Email Not Sending
- Verify Gmail App Password is correct
- Enable "Less secure app access" if needed
- Check spam folder for test emails
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` match

### Cloudinary Upload Issues
- Verify API credentials are correct
- Check Cloudinary API key permissions
- Ensure CORS is configured properly

### Authentication Issues
- Clear browser cookies
- Verify `NEXTAUTH_SECRET` is set
- Check session configuration in `lib/auth.ts`

## Production Deployment

### On Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel Settings
4. Deploy

### On Other Platforms
1. Set environment variables on your hosting platform
2. Run database migrations: `pnpm prisma db push`
3. Build: `pnpm build`
4. Start: `pnpm start`

## Next Steps

- [ ] Complete the database setup
- [ ] Add email and Cloudinary credentials
- [ ] Create your landlord account
- [ ] Add your first property
- [ ] Add tenants
- [ ] Record rent payments
- [ ] Test email notifications
- [ ] Deploy to production

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review the API endpoint documentation above
3. Check Prisma documentation: https://www.prisma.io/docs
4. Check Next.js documentation: https://nextjs.org/docs
