# Open WebUI Integration with n8n Workflows

## Overview

This document explains how to configure Open WebUI to use your n8n workflows as different "models" through your secure API proxy. This setup ensures:

1. Users only have access to workflows based on their subscription tier
2. All requests are authenticated and rate-limited
3. Your Open Router API key remains secure (never exposed to clients)
4. Usage is tracked for billing and analytics

## Configuration Steps

### 1. Set Up Custom API Endpoints in Open WebUI

In Open WebUI, you can add custom API endpoints that will connect to your secure proxy instead of directly to LLM providers.

1. Log in to Open WebUI as an admin
2. Go to Settings > Models
3. Click "Add New Model"
4. For each workflow, create a model with these settings:

#### Standard Tier Models:

**Basic Chat Model:**
- Name: "Basic Assistant"
- Description: "General purpose assistant for everyday questions"
- API Base URL: `https://yourdomain.com/api/n8n-proxy`
- API Key: Leave blank (handled by your proxy)
- API Path: `/`
- API Method: `POST`
- Request Format:
  ```json
  {
    "workflowId": "basic-chat",
    "inputs": {
      "message": "{prompt}",
      "context": "{context}"
    }
  }
  ```

**Simple RAG Model:**
- Name: "Document Assistant"
- Description: "Assistant for answering questions about your documents"
- API Base URL: `https://yourdomain.com/api/n8n-proxy`
- API Key: Leave blank (handled by your proxy)
- API Path: `/`
- API Method: `POST`
- Request Format:
  ```json
  {
    "workflowId": "simple-rag",
    "inputs": {
      "message": "{prompt}",
      "context": "{context}"
    }
  }
  ```

#### Pro Tier Models (add these in addition to Standard models):

**Advanced RAG Model:**
- Name: "Advanced Document Assistant"
- Description: "Enhanced document analysis with better context handling"
- API Base URL: `https://yourdomain.com/api/n8n-proxy`
- API Key: Leave blank (handled by your proxy)
- API Path: `/`
- API Method: `POST`
- Request Format:
  ```json
  {
    "workflowId": "advanced-rag",
    "inputs": {
      "message": "{prompt}",
      "context": "{context}",
      "options": {
        "similarity_threshold": 0.8,
        "max_sources": 5
      }
    }
  }
  ```

**Data Analysis Model:**
- Name: "Data Analyst"
- Description: "Analyze data and generate insights"
- API Base URL: `https://yourdomain.com/api/n8n-proxy`
- API Key: Leave blank (handled by your proxy)
- API Path: `/`
- API Method: `POST`
- Request Format:
  ```json
  {
    "workflowId": "data-analysis",
    "inputs": {
      "message": "{prompt}",
      "data": "{context}"
    }
  }
  ```

#### Enterprise Tier Models (add these in addition to Standard and Pro models):

**Custom Workflow Model:**
- Name: "Enterprise Assistant"
- Description: "Customized workflows for enterprise needs"
- API Base URL: `https://yourdomain.com/api/n8n-proxy`
- API Key: Leave blank (handled by your proxy)
- API Path: `/`
- API Method: `POST`
- Request Format:
  ```json
  {
    "workflowId": "custom-workflows",
    "inputs": {
      "message": "{prompt}",
      "context": "{context}",
      "options": {
        "custom_parameters": true,
        "enterprise_features": true
      }
    }
  }
  ```

### 2. Set Up n8n Workflows

For each model in Open WebUI, create a corresponding workflow in n8n:

1. Create a new workflow in n8n
2. Add a Webhook node as the trigger
3. Configure the webhook with a unique path that matches your workflowId
4. Add authentication to the webhook (e.g., Bearer token)
5. Build your workflow logic
6. Connect to Open Router API using your API key (safely stored in n8n)
7. Return the response in a format compatible with Open WebUI

### 3. Security Considerations

- Ensure n8n is properly secured with authentication
- Restrict access to n8n admin interface
- Use HTTPS for all communications
- Regularly rotate API keys and tokens
- Monitor usage for unusual patterns

## User Experience

With this setup, when users log in to Open WebUI:

1. They will only see the models available for their subscription tier
2. When they select a model and send a message, it goes to your secure API proxy
3. Your proxy authenticates the user, checks their subscription tier, and enforces rate limits
4. If authorized, the request is forwarded to the appropriate n8n workflow
5. The n8n workflow processes the request and returns the response
6. The response is sent back to Open WebUI for display

This architecture keeps your API keys secure while providing a seamless experience for users.
