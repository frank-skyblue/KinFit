# Getting Started with KinFit

This guide will help you set up and run KinFit locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js) or **yarn**

## Step-by-Step Setup

### 1. Clone the Repository

```bash
cd ~/Documents/project
# Already cloned at: /home/frank/Documents/project/KinFit
cd KinFit
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb

# Verify MongoDB is running
sudo systemctl status mongodb
```

#### Option B: MongoDB Atlas (Cloud)
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Use it in the `.env` file

### 3. Backend Setup

```bash
# Navigate to backend directory
cd back-end

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kinfit
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF

# Seed the exercise database (optional but recommended)
npm run seed

# Start the backend server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 KinFit API server running on port 5001
📍 Health check: http://localhost:5001/api/health
```

Test the backend:
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status":"ok","message":"KinFit API is running"}
```

### 4. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd front-end

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3001
```

## First Time User Setup

1. Click **"Sign up"** on the login page
2. Fill in the registration form:
   - Display Name: Your name
   - Username: Unique username (3-30 characters)
   - Email: Your email
   - Password: At least 6 characters
3. Click **"Sign Up"**
4. You'll be automatically logged in and redirected to the dashboard

## Quick Test Flow

### 1. Create Your First Workout

1. Click **"New Workout"** button
2. Fill in workout details:
   - Date: Today (default)
   - Title: "Chest & Back" (optional)
3. Click **"+ Add Exercise"**
4. Search for "Bench Press" and click it
5. Set values:
   - Weight Type: Actual (a)
   - Weight: 185
   - Reps: 8
   - Sets: 4
6. Add another exercise (e.g., "Pull-ups")
   - Weight Type: Bodyweight
   - Reps: 10
   - Sets: 3
7. Click **"Save Workout"**

### 2. View Your Workout

1. Navigate to **"Workouts"** tab
2. See your workout listed
3. Click on it to view details

### 3. Browse Exercise Library

1. Navigate to **"Exercises"** tab
2. Search or filter exercises
3. Create a custom exercise if needed

## Development Workflow

### Backend Development

```bash
cd back-end

# Start dev server (auto-restart on changes)
npm run dev

# Build TypeScript
npm run build

# Run built version
npm run serve

# Seed exercises again
npm run seed
```

### Frontend Development

```bash
cd front-end

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Troubleshooting

### Backend Issues

#### MongoDB Connection Error
```
Error: MongoDB connection error
```

**Solution:**
- Check if MongoDB is running: `sudo systemctl status mongodb`
- Verify connection string in `.env` file
- For Atlas, ensure IP whitelist is configured

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or change port in .env file
PORT=5002
```

### Frontend Issues

#### Port Already in Use
```
Error: Port 3001 is already in use
```

**Solution:**
- Change port in `vite.config.ts`:
```typescript
server: {
  port: 3002,
  // ...
}
```

#### API Connection Error
```
Network Error / Failed to fetch
```

**Solution:**
- Ensure backend is running on port 5001
- Check proxy configuration in `vite.config.ts`
- Verify CORS is enabled on backend

### Common Issues

#### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript errors
```bash
# Rebuild TypeScript
cd back-end
npm run build
```

## Useful Commands

### Check if Ports are Free
```bash
# Check backend port
lsof -i :5001

# Check frontend port
lsof -i :3001
```

### View MongoDB Data
```bash
# Connect to MongoDB
mongosh

# Switch to kinfit database
use kinfit

# View collections
show collections

# View users
db.users.find().pretty()

# View workouts
db.workouts.find().pretty()

# View exercises
db.exercises.find().pretty()
```

### Reset Database
```bash
# Connect to MongoDB
mongosh

# Drop kinfit database
use kinfit
db.dropDatabase()

# Reseed exercises
cd back-end
npm run seed
```

## Testing API with curl

### Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from response and use it in subsequent requests:

### Get Workouts
```bash
curl -X GET http://localhost:5001/api/workouts \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

### Get Exercises
```bash
curl -X GET http://localhost:5001/api/exercises \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

## Next Steps

Now that you have KinFit running:

1. **Explore the codebase:**
   - Backend: `/back-end/src/`
   - Frontend: `/front-end/src/`

2. **Read the documentation:**
   - [Main README](./README.md)
   - [Backend README](./back-end/README.md)
   - [Frontend README](./front-end/README.md)

3. **Start developing:**
   - Add new features
   - Customize the theme
   - Implement social features

## Need Help?

- Check the [README.md](./README.md) for project overview
- Review API docs in [back-end/README.md](./back-end/README.md)
- Frontend guide in [front-end/README.md](./front-end/README.md)

## Success! 🎉

If you see the KinFit dashboard, you're all set! Start tracking your workouts and building amazing features.

Happy coding! 💪

