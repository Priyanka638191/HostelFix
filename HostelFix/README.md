# HostelFix - Smart Hostel Issue Tracking System

A comprehensive, production-grade full-stack web application for managing hostel issues with intelligent duplicate detection, AI-assisted writing, advanced analytics, and stunning animated UI/UX.

## Features

### For Students
- ✅ **Separate Login Flow**: Dedicated student login page with friendly, welcoming UI
- ✅ **AI-Assisted Issue Writing**: Real-time suggestions, keyword detection, and writing assistance
- ✅ **Issue Reporting**: Create issues with categories, priorities, descriptions, and images
- ✅ **Automatic Tagging**: Issues automatically tagged with hostel/block/room information
- ✅ **Enhanced Duplicate Detection**: ML-powered detection with similarity scores, keyword highlighting, and visual feedback
- ✅ **Smart Issue Timeline**: Animated timeline showing issue progress with time spent in each stage
- ✅ **Issue Tracking**: Real-time status updates (Reported → Assigned → In Progress → Resolved → Closed)
- ✅ **Public/Private Issues**: Control visibility of your issues
- ✅ **Comments & Reactions**: Engage with public issues through comments and reactions
- ✅ **Lost & Found**: Report lost items or claim found items
- ✅ **Announcements**: View targeted announcements from hostel management
- ✅ **Animated UI**: Smooth transitions, micro-interactions, and motion-rich interface
- ✅ **Mobile Responsive**: Beautiful UI that works on all devices

### For Admins
- ✅ **Separate Admin Login**: Professional, authority-focused admin login page
- ✅ **Advanced Analytics Dashboard**: Comprehensive analytics with charts and KPIs
  - Issue category distribution (Pie charts)
  - Hostel/block-wise issue density (Heatmap ready)
  - Average resolution time tracking
  - Pending vs resolved issues
  - Status distribution (Bar charts)
  - **Smart Delay Detection**: Auto-flag issues exceeding average resolution time
  - **Issue Heatmap**: Visual density map of hostel/block issues
- ✅ **Issue Management**: Assign issues to caretakers, update status, add remarks
- ✅ **Pagination & Search**: Efficient issue browsing with search and filters
- ✅ **Announcements**: Post targeted announcements to specific hostels/blocks
- ✅ **Lost & Found Moderation**: Approve and manage lost & found claims

### Technical Features
- ✅ **Separate Authentication Flows**: Role-specific login endpoints with strict validation
- ✅ **JWT Authentication**: Secure token-based authentication with role claims
- ✅ **Role-Based Access Control**: Strict route protection (students cannot access admin APIs)
- ✅ **ML/NLP Integration**: TF-IDF vectorization + Cosine Similarity with keyword extraction
- ✅ **Service Layer Architecture**: Clean separation of business logic
- ✅ **API Versioning**: `/api/v1/` endpoints with backward compatibility
- ✅ **Pagination & Search**: Efficient data retrieval with filtering
- ✅ **Framer Motion**: Advanced animations and transitions
- ✅ **Skeleton Loaders**: Professional loading states
- ✅ **Image Upload**: Cloudinary integration for image storage
- ✅ **Real-time Updates**: Live status updates and notifications
- ✅ **Dark Mode Support**: Beautiful dark mode UI
- ✅ **Responsive Design**: Mobile-first, works on all screen sizes

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Advanced animations and transitions
- **React Router** - Client-side routing
- **Recharts** - Beautiful charts and analytics
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Lucide React** - Modern icon library

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **JWT** - JSON Web Tokens for authentication
- **Pydantic** - Data validation
- **scikit-learn** - ML/NLP for duplicate detection
- **Cloudinary** - Image upload and storage
- **Python-dotenv** - Environment variable management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** (local or MongoDB Atlas)
- **Cloudinary Account** (for image uploads)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HostelFix
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials

# Seed database (optional)
python seed_data.py

# Run the server
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API URL (default: http://localhost:8000)

# Run development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access the Application

- Open `http://localhost:3000` in your browser
- Login with seeded credentials:
  - **Admin**: `admin@hostelfix.com` / `admin123`
  - **Student**: `student1@hostelfix.com` / `student123`

## 📁 Project Structure

```
HostelFix/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT authentication
│   │   ├── database.py           # MongoDB connection
│   │   ├── models.py             # Pydantic models
│   │   ├── ml_duplicate_detection.py  # ML/NLP duplicate detection
│   │   ├── cloudinary_config.py # Image upload config
│   │   └── routers/
│   │       ├── auth.py           # Authentication routes
│   │       ├── issues.py         # Issue management routes
│   │       ├── admin.py          # Admin dashboard routes
│   │       ├── lost_found.py     # Lost & Found routes
│   │       └── announcements.py   # Announcements routes
│   ├── main.py                   # FastAPI app entry point
│   ├── seed_data.py              # Database seeding script
│   ├── requirements.txt         # Python dependencies
│   └── .env.example              # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── contexts/             # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Issues.jsx
│   │   │   ├── CreateIssue.jsx
│   │   │   ├── IssueDetail.jsx
│   │   │   ├── LostFound.jsx
│   │   │   ├── Announcements.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── utils/
│   │   │   └── api.js            # API client
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css             # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## 🚀 New & Enhanced Features

### Separate Authentication Flows
- **Student Login** (`/login/student`): Friendly, colorful, welcoming interface
- **Admin Login** (`/login/admin`): Professional, minimal, authority-focused design
- **Strict Validation**: Role-based endpoint validation prevents unauthorized access

### AI-Assisted Issue Writing
- Real-time keyword extraction and display
- Live suggestions as you type
- Warnings for vague descriptions
- Location and priority recommendations
- Keywords highlighted for ML matching

### Smart Issue Timeline
- Animated vertical timeline showing issue progress
- Time spent in each stage calculated and displayed
- Visual indicators for current status
- Smooth animations and transitions

### Smart Delay Detection (Admin)
- Automatically flags issues exceeding average resolution time
- Visual alerts in admin dashboard
- Helps prioritize urgent issues

### Issue Heatmap (Admin)
- Visual density map of hostel/block issues
- Color intensity based on issue frequency
- Helps identify problem areas

## 🤖 ML/NLP Duplicate Detection

### How It Works

The duplicate detection system uses **TF-IDF (Term Frequency-Inverse Document Frequency)** vectorization combined with **Cosine Similarity** to identify similar issues.

1. **Text Preprocessing**: 
   - Convert to lowercase
   - Remove special characters
   - Normalize whitespace

2. **TF-IDF Vectorization**:
   - Converts text into numerical vectors
   - Weights important terms higher
   - Uses n-grams (1-2 words) for better matching

3. **Cosine Similarity**:
   - Calculates similarity between new issue and existing issues
   - Returns similarity score (0-1)
   - Threshold: 0.7 (70% similarity)

4. **Result**:
   - If similarity > threshold, warns user with visual alert
   - Shows top 5 most similar issues with:
     - Similarity percentage (0-100%)
     - Matching keywords highlighted
     - Clickable links to similar issues
   - User can "Submit Anyway" or "Browse Existing Issues"
   - ML explanation displayed in user-friendly language

### Why This Approach?

- **TF-IDF**: Captures important keywords while reducing noise
- **Cosine Similarity**: Measures semantic similarity, not just exact matches
- **N-grams**: Catches phrases like "water leak" vs "leaking water"
- **Threshold-based**: Balances false positives and false negatives

### Enhanced Features

- **Keyword Extraction**: Identifies important terms using TF-IDF
- **Matching Keywords**: Highlights common keywords between issues
- **Similarity Percentage**: Clear 0-100% score display
- **Visual Feedback**: Animated warnings with actionable options

### Example

```
New Issue: "Tap leaking in bathroom, water waste"
Existing Issue: "Bathroom tap is leaking continuously"

Similarity: 85%
Matching Keywords: ["tap", "leaking", "bathroom", "water"]
Result: Visual duplicate warning with keyword highlights
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

#### Issues
- `GET /api/issues/` - List all issues
- `POST /api/issues/` - Create new issue
- `POST /api/issues/check-duplicate` - Check for duplicates
- `GET /api/issues/{id}` - Get issue details
- `PUT /api/issues/{id}` - Update issue (admin)
- `POST /api/issues/{id}/comments` - Add comment
- `POST /api/issues/{id}/react` - React to issue

#### Admin
- `GET /api/admin/dashboard` - Get dashboard analytics
- `GET /api/admin/issues/all` - Get all issues

#### Lost & Found
- `GET /api/lost-found/` - List items
- `POST /api/lost-found/` - Create item
- `POST /api/lost-found/{id}/claim` - Claim item

#### Announcements
- `GET /api/announcements/` - List announcements
- `POST /api/announcements/` - Create announcement (admin)

## 🎨 UI/UX Features

- **Modern SaaS Design**: Clean, professional interface
- **Card-based Layouts**: Easy to scan and navigate
- **Color Coding**: Visual indicators for status and priority
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode**: Eye-friendly dark theme
- **Smooth Animations**: Polished user experience
- **Toast Notifications**: User-friendly feedback
- **Loading States**: Clear feedback during operations

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Pydantic
- CORS configuration
- Environment variable protection


## 📄 License

This project is created for HackOverflow hackathon.


## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] Push notifications
- [ ] Issue priority auto-assignment
- [ ] Caretaker assignment workflow
- [ ] Issue escalation system
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Multi-language support


