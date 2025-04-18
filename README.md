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

### Backend Setup

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
   Then update the environment variables in `.env` with your configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

- Backend runs on http://localhost:3000
- Frontend runs on http://localhost:3001

## Version Control

This project uses Git for version control. Each phase of development is tracked in separate commits/branches.

### Current Phase
Phase 1: Initial setup and basic configuration
- Basic project structure
- Database connection setup
- Environment configuration
- Basic server setup 