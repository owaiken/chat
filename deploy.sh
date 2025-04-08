#!/bin/bash
# Deployment script for Owaiken

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Owaiken Deployment Helper ===${NC}"
echo "This script will help you prepare your project for deployment."

# Check if .env.local exists and has been configured
if [ ! -f .env.local ]; then
  echo -e "${RED}Error: .env.local file not found!${NC}"
  echo "Please create .env.local based on .env.local.example and fill in your credentials."
  exit 1
fi

# Check for placeholder values in .env.local
if grep -q "replace_with_your" .env.local; then
  echo -e "${YELLOW}Warning: .env.local contains placeholder values!${NC}"
  echo "Please update .env.local with your actual API keys and credentials before deploying."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${GREEN}Installing dependencies...${NC}"
npm install --legacy-peer-deps

echo -e "${GREEN}Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Please fix the errors before deploying.${NC}"
  exit 1
fi

echo -e "${GREEN}Running linting...${NC}"
npm run lint

echo -e "${YELLOW}Deployment Checklist:${NC}"
echo "1. Have you set up your Clerk authentication?"
echo "2. Have you set up your Supabase database and run the schema.sql?"
echo "3. Have you created your Stripe subscription products and prices?"
echo "4. Have you configured your n8n instance and workflows?"

read -p "Have you completed all these steps? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Please complete all the necessary setup steps before deploying.${NC}"
  echo "Refer to the README.md and deployment-checklist.md for detailed instructions."
  exit 1
fi

echo -e "${GREEN}Project is ready for deployment!${NC}"
echo "To deploy to Vercel, run the following commands:"
echo "1. Push your code to GitHub:"
echo "   git init"
echo "   git add ."
echo "   git commit -m \"Initial commit\""
echo "   git remote add origin https://github.com/yourusername/owaiken.git"
echo "   git push -u origin main"
echo
echo "2. Connect your GitHub repository to Vercel and deploy!"
echo "   Don't forget to set up all environment variables in the Vercel dashboard."
echo
echo -e "${GREEN}Good luck with your deployment!${NC}"
