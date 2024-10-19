# Farb Next.js Monorepo

This repository contains a monorepo setup for a Next.js frontend and a NestJS backend.

## Getting Started

### Prerequisites

Make sure you have the following installed:

-   [Node.js](https://nodejs.org/) (version 21 or higher)
-   [Yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/farb-next-js.git
    cd farb-next-js
    ```

2. Install dependencies using Yarn:

    ```bash
    yarn install
    ```

### Environment Variables

Create a `.env` file in the `backend` folder of the project based on the `.env.example` file.

Replace the placeholder values with your actual credentials.

### Development

To start the development server for both the frontend and backend, run:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:3001](http://localhost:3001) for the backend.

## Deployment to Fly.io

### Continuous Deployment

Pushing to the `main` branch in GitHub will automatically deploy the Fly.io app. This is achieved using GitHub Actions.

### Manual Deployment

To deploy the application to Fly.io, follow these steps:

1. Install the Fly CLI:

    ```bash
    curl -L https://fly.io/install.sh | sh
    ```

2. Authenticate with Fly.io:

    ```bash
    fly auth login
    ```

3. Setup the application:

    ```bash
    fly launch
    ```

4. Deploy the application:

    ```bash
    fly deploy
    ```

### Setting Environment Secrets on Fly.io

To set environment secrets for your Fly.io deployment, use the following commands:

1. Set the environment secrets:

    ```bash
    fly secrets set ANTHROPIC_API_KEY=...
    fly secrets set USERS=...
    ```

2. Redeploy the application to apply the new secrets:

    ```bash
    fly deploy
    ```
