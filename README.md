# Nickname Voting System

A minimal Next.js web application for private nickname voting at parties. Students can suggest nicknames for their classmates, and admins can view results and export them to Excel.

## Features

### Student Features
- **Secure Login**: Each student has unique credentials
- **Nickname Suggestions**: Suggest fun nicknames for classmates (excluding yourself)
- **One-Time Submission**: Votes are final and cannot be edited
- **Privacy Protection**: Cannot see other people's votes or suggestions

### Admin Features
- **Secure Admin Dashboard**: Separate admin authentication
- **Results Overview**: View all students with their winning nicknames
- **Voting Statistics**: See total voters, votes, and participation metrics
- **Excel Export**: Download results as .xlsx file with student names and winning nicknames
- **Tie-Breaking**: Automatically handles ties by choosing the first-suggested nickname

### Technical Features
- **Mobile-Friendly**: Responsive design works on all devices
- **SQLite Database**: Lightweight database for development
- **Session Management**: Secure authentication with JWT tokens
- **Data Validation**: Prevents duplicate voting and validates inputs

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Extract and navigate to the project directory**
   ```bash
   cd nickname-voting-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   node setup.js
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Demo Credentials

## Database Schema

The application uses SQLite with three main tables:

### Students Table
- `id`: Primary key
- `username`: Unique login username
- `password`: Hashed password
- `name`: Full student name
- `has_voted`: Boolean flag to prevent duplicate voting

### Votes Table
- `id`: Primary key
- `voter_id`: Foreign key to students table
- `target_student_id`: Foreign key to students table (who the nickname is for)
- `nickname`: The suggested nickname
- `created_at`: Timestamp for tie-breaking

### Admin Table
- `id`: Primary key
- `username`: Admin username
- `password`: Hashed admin password

## User Flow

### For Students
1. Login with provided credentials
2. See list of all other students (excluding yourself)
3. Suggest nicknames for any students (optional)
4. Submit suggestions (one-time only)
5. Receive confirmation message

### For Admins
1. Login via admin portal (`/admin`)
2. View voting statistics and results
3. See winning nickname for each student
4. Export results to Excel file

## Voting Rules

1. **One Vote Per Student**: Each student can only submit once
2. **Nickname Popularity**: The nickname with the most votes wins
3. **Tie-Breaking**: If nicknames tie, the first-suggested nickname wins
4. **Privacy**: Students cannot see votes or other submissions
5. **Optional Participation**: Students can skip suggesting nicknames for anyone

## File Structure

```
nickname-voting-system/
├── pages/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin-specific APIs
│   │   ├── students.js    # Get students list
│   │   └── vote.js        # Submit votes
│   ├── admin/
│   │   ├── index.js       # Admin login page
│   │   └── dashboard.js   # Admin results dashboard
│   ├── index.js           # Student login page
│   ├── voting.js          # Voting interface
│   └── _app.js            # Next.js app configuration
├── lib/
│   ├── database.js        # Database operations
│   └── auth.js            # Authentication utilities
├── styles/
│   └── globals.css        # Global styles
├── setup.js               # Database initialization script
└── package.json           # Project dependencies
```

## Customization

### Adding More Students
1. Edit the `students` array in `lib/database.js`
2. Run `node setup.js` to reinitialize the database

### Changing Admin Credentials
1. Edit the admin creation section in `lib/database.js`
2. Run `node setup.js` to reinitialize the database

### Styling
- Modify `styles/globals.css` for visual customization
- The design is mobile-first and responsive

## Production Deployment

### Environment Variables
Create a `.env.local` file:
```
JWT_SECRET=your-secure-jwt-secret-key
```

### Database Migration
For production, consider migrating from SQLite to PostgreSQL:
1. Install `pg` package: `npm install pg`
2. Update database connection in `lib/database.js`
3. Set database URL in environment variables

### Build and Deploy
```bash
npm run build
npm start
```

## Security Considerations

- **Password Hashing**: All passwords are hashed with bcrypt
- **JWT Tokens**: Secure session management with HTTP-only cookies
- **Input Validation**: Server-side validation prevents malicious inputs
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **CSRF Protection**: SameSite cookie settings prevent CSRF attacks

## Troubleshooting

### Database Issues
- Delete `database.sqlite` and run `node setup.js` again
- Check file permissions in the project directory

### Port Conflicts
- Change the port in `package.json` scripts if 3000 is occupied
- Use `npm run dev -- -p 3001` to run on a different port

### Authentication Problems
- Clear browser cookies and try again
- Check that JWT_SECRET is set consistently

## Support

This application was built as a minimal, lightweight solution for party nickname voting. For additional features or modifications, refer to the well-commented source code.

## License

This project is provided as-is for educational and party use.

