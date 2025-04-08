# Owaiken - Secure Chat Model Service

A secure service for users to access chat models safely with Row-Level Security (RLS) and subscription tiers.

## Features

- **Secure API Proxy**: Uses your Open Router API key for all users
- **Row-Level Security**: Ensures user data is only accessible to the user who created it
- **Subscription Model**: Three tiers ($5/$50/$500 per month)
- **Safe Python Scripts**: Restricted to predefined templates and workflows
- **User Authentication**: Powered by Clerk
- **Database**: Supabase with RLS policies
- **Payments**: Stripe integration for subscription management

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- Clerk account
- Stripe account
- Open Router API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/owaiken.git
   cd owaiken
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in the environment variables in `.env.local` with your API keys and configuration.

5. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in the Supabase SQL editor
   - Copy your Supabase URL and anon key to `.env.local`

6. Set up Clerk:
   - Create a new Clerk application
   - Configure the JWT template to include user ID for Supabase RLS
   - Copy your Clerk publishable key and secret key to `.env.local`

7. Set up Stripe:
   - Create products and prices for your subscription tiers
   - Set up webhook endpoints
   - Copy your Stripe publishable key, secret key, and price IDs to `.env.local`

8. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository

2. Connect your repository to Vercel

3. Configure environment variables in Vercel dashboard

4. Deploy!

### Setting up Webhook Endpoints

For production, you'll need to set up webhook endpoints for Stripe and Clerk:

1. Stripe webhook: `https://yourdomain.com/api/stripe/webhook`
2. Clerk webhook: Configure in Clerk dashboard to sync user data with Supabase

## Row-Level Security (RLS) Policies

This project uses Supabase RLS policies to ensure data isolation:

- Users can only access their own conversations
- Users can only access their own usage data
- Python scripts are restricted based on subscription tier

## Subscription Tiers

1. **Standard ($5/month)**
   - Access to basic models
   - 100 messages per day
   - Basic Python script templates

2. **Pro ($50/month)**
   - Access to advanced models
   - 1,000 messages per day
   - Advanced Python script templates

3. **Enterprise ($500/month)**
   - Access to all models
   - Unlimited messages
   - Custom Python scripts
   - Dedicated support

## License

[MIT](LICENSE)
