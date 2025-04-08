# Deployment Checklist for Owaiken

## Before Deployment

### 1. Environment Variables
- [ ] Fill in all values in `.env.local` with your actual credentials
- [ ] Set up environment variables in Vercel dashboard during deployment

### 2. External Services Setup
- [ ] **Clerk**:
  - [ ] Create a Clerk application
  - [ ] Configure JWT template to include user ID for Supabase RLS
  - [ ] Set up sign-in and sign-up pages
  - [ ] Configure webhooks to sync user data with Supabase

- [ ] **Supabase**:
  - [ ] Create a new Supabase project
  - [ ] Run the SQL from `supabase/schema.sql` in the Supabase SQL editor
  - [ ] Enable Row Level Security (RLS) on all tables
  - [ ] Test RLS policies to ensure they work as expected

- [ ] **Stripe**:
  - [ ] Create products and prices for your subscription tiers
  - [ ] Set up webhook endpoints (https://yourdomain.com/api/stripe/webhook)
  - [ ] Test checkout flow in test mode

- [ ] **Open Router**:
  - [ ] Ensure your API key has sufficient credits
  - [ ] Test API access

- [ ] **n8n**:
  - [ ] Set up your managed n8n instance
  - [ ] Create the necessary workflows
  - [ ] Secure the n8n instance with authentication
  - [ ] Configure webhooks for each workflow

### 3. Build and Test
- [ ] Run `npm run build` to ensure the project builds without errors
- [ ] Test all features locally:
  - [ ] Authentication flow
  - [ ] Subscription management
  - [ ] Chat functionality
  - [ ] n8n integration
  - [ ] Rate limiting

## Deployment Steps

### 1. Version Control
- [ ] Push your code to a GitHub repository
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/yourusername/owaiken.git
  git push -u origin main
  ```

### 2. Vercel Deployment
- [ ] Connect your GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Deploy the project
- [ ] Set up custom domain (optional)

### 3. Post-Deployment
- [ ] Test all features in production
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for database
- [ ] Test subscription flow with real payments (using test cards)

## Security Considerations
- [ ] Ensure all API keys are kept secret
- [ ] Verify RLS policies are working correctly
- [ ] Set up rate limiting at the infrastructure level
- [ ] Implement monitoring for unusual activity
- [ ] Set up regular security audits

## Scaling Considerations
- [ ] Plan for database scaling as user base grows
- [ ] Consider caching strategies for frequently accessed data
- [ ] Monitor API usage and costs
- [ ] Set up alerts for approaching limits
