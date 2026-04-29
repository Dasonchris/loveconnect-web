# LoveConnect App - Deployment Guide

## Project Structure
- **Client**: React + Vite (deployed to Vercel)
- **Server**: Express.js + MongoDB (deploy separately)

## Pre-Deployment Setup

### 1. Environment Variables
Create `.env` files in both directories (copy from `.env.example`):

```bash
# Root level (.env)
# Server variables
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
VITE_API_URL=https://your-api-domain.com/api
```

### 2. Verify Dependencies
Ensure backend dependencies are NOT in client/package.json:
```bash
✓ Removed: bcryptjs, cors, express, jsonwebtoken, mongoose, multer, socket.io, node
✓ Added: socket.io-client (client-side library)
✓ Kept: cloudinary, framer-motion, react, react-router-dom
```

### 3. Build Locally
```bash
# Install dependencies
npm run install-deps

# Test build
npm run build

# Check output
ls -la client/dist/  # Should have index.html and assets
```

## Vercel Deployment (Frontend)

### Step 1: Deploy Client
```bash
cd client
npm install
npm run build
npx vercel --prod
```

Or connect your GitHub repo to Vercel for auto-deployment.

**Vercel Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 2: Set Environment Variables in Vercel Dashboard
- `VITE_API_URL`: https://your-api-server.com/api

### Step 3: Configure Rewrites
Vercel rewrites are already configured in `vercel.json` to handle SPA routing.

## Backend Deployment (Choose One)

### Option A: Deploy to Render
1. Push code to GitHub
2. Create new Web Service on render.com
3. Connect your GitHub repo
4. Build Command: `npm install --prefix server`
5. Start Command: `node server/server.js`
6. Set environment variables in Render dashboard
7. Get your API URL (e.g., https://your-api.onrender.com)

### Option B: Deploy to Railway
1. Create new project on railway.app
2. Connect GitHub repo
3. Add MongoDB database plugin
4. Set environment variables
5. Deploy

### Option C: Deploy to Heroku (if you have credits)
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_connection_string
heroku config:set JWT_SECRET=your_secret
heroku config:set CORS_ORIGIN=https://your-app.vercel.app
git push heroku main
```

## Post-Deployment

### 1. Update Frontend API URL
After backend deployment, update in Vercel:
- Dashboard → Settings → Environment Variables
- Set `VITE_API_URL` to your backend URL

### 2. Update Backend CORS
After frontend deployment, update backend:
- Set `CORS_ORIGIN=https://your-frontend.vercel.app`

### 3. Test Connectivity
```bash
# Test API endpoint
curl https://your-api.com/

# Check Socket.IO connection
# Open browser console and verify WebSocket connects
```

## Troubleshooting

### Build Fails: "Cannot find module 'express'"
**Solution**: Verify backend packages removed from client/package.json ✓ (Already fixed)

### CORS Errors in Browser
**Solution**: 
- Check `CORS_ORIGIN` env var matches your frontend URL
- Restart backend after env var changes

### Socket.IO Connection Fails
**Solution**:
- Verify backend is running at correct URL
- Check browser console for WebSocket errors
- Update Socket.IO URL in client code if needed

### Database Connection Fails
**Solution**:
- Verify `MONGODB_URI` is correct and accessible
- Check MongoDB Atlas IP whitelist
- Ensure network access is enabled

## Scripts Summary

```bash
# Root level
npm run dev              # Start both client & server locally
npm run build            # Build client only
npm run start            # Start server only
npm run install-deps     # Install all dependencies

# Client only
cd client && npm run dev     # Vite dev server
cd client && npm run build   # Build for production

# Server only
cd server && npm run dev     # Server with nodemon
cd server && npm start       # Server production
```

## Additional Resources
- [Vercel Docs](https://vercel.com/docs)
- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
