# Form Builder Application

A Google Forms-like application built with React, Node.js, Express, and Microsoft SQL Server. This system allows users to create forms with various field types including conditional logic and groups, then share them to collect responses.

## Features

- User authentication and subscription management
- Per-user database creation for paid subscribers
- Form builder with various field types
- Conditional logic for form fields
- Group fields for better organization
- Form sharing and response collection
- Response analytics

## Tech Stack

- **Frontend**: React, Material-UI, Formik, Yup
- **Backend**: Node.js, Express, TypeScript
- **Database**: Microsoft SQL Server
- **Authentication**: JWT

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server
- npm or yarn

## Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd form-builder
   ```

2. Install dependencies
   ```bash
   npm run install-all
   ```

3. Configure environment variables
   ```bash
   cp server/.env.example server/.env
   ```

   Then edit the `.env` file with your SQL Server credentials and JWT secret.

4. Start SQL Server and make sure it's accessible with the credentials provided in the `.env` file.

5. Start the application
   ```bash
   npm start
   ```

   This will start both the React client and Node.js server concurrently.

## Database Structure

- **Master Database**: Stores user information and handles authentication
- **User Databases**: Each paid user gets their own database (forms_user_{userId}) which contains:
  - Forms table: Stores form definitions with JSON schema
  - Responses table: Stores submissions to forms

## Usage

1. Register a new account
2. Upgrade to a paid subscription (BASIC or PREMIUM)
3. Start creating forms
4. Share forms for responses
5. View and analyze collected data

## License

MIT