# Form Management System

A full-stack application for managing forms and form submissions.

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend application

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQL Server
- Docker and Docker Compose (optional)

### Development with Docker

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd form-management-system
   ```

2. Create environment files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Update the environment variables in both files with your configuration.

3. Start the development environment:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

   This will start:
   - Frontend at http://localhost:3001
   - Backend at http://localhost:3000
   - SQL Server at localhost:1433

### Manual Development Setup

#### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables with your configuration.

4. Start the development server:
   ```bash
   npm start
   ```

## Development

### TypeScript Support

The project uses TypeScript for better type safety and developer experience. To check types:

```bash
# In client directory
npm run type-check

# In server directory
npm run type-check
```

### Code Quality

We use several tools to maintain code quality:

- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for testing

To run linting:
```bash
npm run lint
```

To run tests:
```bash
npm test
```

### Security Features

- CSRF protection
- Rate limiting
- Password complexity validation
- XSS protection
- SQL injection prevention
- Secure headers with Helmet

### API Documentation

API documentation is available at:
- Development: http://localhost:3000/api/docs
- Production: https://your-domain.com/api/docs

## Production Deployment

1. Build the application:
   ```bash
   docker-compose build
   ```

2. Start the production environment:
   ```bash
   docker-compose up -d
   ```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Version Control

This project uses Git for version control. Each phase of development is tracked in separate commits/branches.

### Current Phase
Phase 1: Initial setup and basic configuration
- Basic project structure
- Database connection setup
- Environment configuration
- Basic server setup 