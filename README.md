# Face Recognition App

A face recognition application built with Node.js, Express, MongoDB, Vue 3, and Luxand Cloud API. Register faces and verify them to display personal information.

## Features

- **Face Registration**: Capture and register faces with personal information using Luxand Cloud API
- **Face Verification**: Real-time face detection and verification via Luxand Cloud
- **Modern Mobile-First UI**: Built with Vue 3 and Element Plus
- **Secure Storage**: Face IDs stored in MongoDB Atlas

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Atlas)
- Mongoose ODM
- Luxand Cloud API (Face Recognition)

### Frontend
- Vue 3 + Vite
- Element Plus (UI Components)
- Vue Router
- Axios

## Project Structure

```
face-recognition/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   └── User.js               # User schema with face ID
│   ├── routes/
│   │   └── users.js              # API routes
│   ├── services/
│   │   └── luxand.js             # Luxand Cloud API integration
│   ├── server.js                 # Express server (serves frontend build)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── FaceRegister.vue  # Registration page
│   │   │   └── FaceVerify.vue    # Verification page
│   │   ├── router/
│   │   │   └── index.js          # Vue Router setup
│   │   ├── App.vue
│   │   └── main.js
│   ├── dist/                     # Production build (served by backend)
│   ├── package.json
│   └── vite.config.js
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd face-recognition
```

### 2. Get Luxand Cloud API Token

1. Visit https://luxand.cloud/
2. Sign up for an account
3. Get your API token from the dashboard

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/face_recognition
LUXAND_API_TOKEN=your_luxand_api_token_here
PORT=5000
```

Replace:
- `<username>`, `<password>`, `<cluster>` with your MongoDB Atlas credentials
- `your_luxand_api_token_here` with your Luxand Cloud API token

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode (Separate servers)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Mode (Single server)

Build the frontend and run the backend:

```bash
# From backend directory
cd backend
npm run build
npm start
```

Or build manually:

```bash
# Build frontend
cd frontend
npm run build

# Run backend (serves frontend build)
cd ../backend
npm start
```

The application will be available at:
- **Single URL**: http://localhost:5000 (serves both frontend + API)

## Deployment

### Deploy to Production (e.g., Render, Railway, Heroku)

1. Push your code to the git repository
2. Set environment variables in your hosting platform:
   - `MONGODB_URI`
   - `LUXAND_API_TOKEN`
   - `PORT` (if required by platform)
3. Add a build command: `cd backend && npm run build`
4. Add a start command: `cd backend && npm start`
5. Deploy!

The backend will automatically build the frontend and serve the static files.

## Usage

### Register a Face

1. Navigate to `/register`
2. Fill in personal information (name, email, phone)
3. Click "Start Camera" to enable your webcam
4. Position your face in the frame
5. Click "Capture Photo" to take a photo
6. Click "Register" to save your information
   - The photo will be sent to Luxand Cloud API for face enrollment
   - Your face ID and personal info will be stored in MongoDB

### Verify a Face

1. Navigate to `/verify`
2. Camera starts automatically
3. Either:
   - Click "Verify Now" to verify once
   - Enable "Auto" switch for continuous verification (every 2 seconds)
4. If matched, your personal information will be displayed with confidence score

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register user with face photo (base64) |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users` | Get all users (without face IDs) |
| POST | `/api/users/verify` | Verify face and return user info |
| DELETE | `/api/users/:id` | Delete user (removes from Luxand & MongoDB) |
| GET | `/api/health` | API health check |

## How Face Recognition Works

1. **Registration**:
   - Photo is captured from webcam
   - Photo is sent to Luxand Cloud API for enrollment
   - Luxand returns a unique face ID
   - Face ID + personal info are stored in MongoDB

2. **Verification**:
   - Photo is captured from webcam
   - Photo is sent to Luxand Cloud API for recognition
   - Luxand returns matching face ID(s) with confidence scores
   - Backend looks up user by face ID in MongoDB
   - Personal info is returned if match found

## Luxand Cloud API

This application uses Luxand Cloud API for face recognition:
- **Endpoint**: https://api.luxand.cloud/v2
- **Authentication**: Token-based (set in `.env` as `LUXAND_API_TOKEN`)
- **Features**: Face enrollment, face recognition, face deletion

For more information: https://luxand.cloud/doc

## Advantages of Using Luxand Cloud API

- No need to download or manage ML model files
- More accurate face recognition (cloud-based processing)
- Simple API integration
- Scalable solution

## License

ISC
