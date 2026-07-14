# 🚀 ColabMeet

ColabMeet is a dynamic, location-aware collaboration platform built with the MERN stack (MongoDB, Express, React, Node.js). It empowers developers, designers, and creators to propose real-world meetups, team up on local projects, and seamlessly organize their collaborations in one beautiful, centralized dashboard.

## ✨ Key Features

### 📍 Advanced Geolocation & Proximity Search
- **Radius Filtering**: Instantly discover meetups happening in your backyard. Filters projects within a 5, 10, 25, or 50-mile radius using browser Geolocation and backend Haversine distance calculations.
- **Smart Carpool Routing**: Features an integrated map (powered by Leaflet & OSRM) that draws real-time driving routes to the event location. Collaborators can drop dynamic "Pickup Point" pins to coordinate team carpooling!

### 🌟 3-Column Command Center Dashboard
- **Live Activity Feed**: A real-time, rolling feed broadcasting platform activity (e.g., *“Sarah proposed a React Workshop”*).
- **Mini-Calendar**: Interactive calendar widget highlighting dates with scheduled meetups. Click any date to instantly filter the project feed.
- **Leaderboard**: Gamified "Top Contributors" panel ranking users based on their collaboration and participation scores.
- **Quick-Access Projects**: A personalized widget granting one-click access to the projects you've joined or created.

### 🛠️ Collaboration Workspace
- **Integrated Kanban Board**: Every project comes equipped with its own drag-and-drop task board to help the team track progress (To Do, In Progress, Review, Done).
- **Project Gallery**: A built-in file storage system allowing teams to upload photos, wireframes, and screenshots. Includes a sleek, full-screen Lightbox viewer.
- **In-App Notifications**: A notification bell alerts users instantly when someone joins their project's waitlist, assigns them a task, or adds a carpool stop.

### 🔒 Core Infrastructure
- **Secure Authentication**: JWT-based user authentication and protected routing.
- **User Profiles**: Customizable profiles showcasing skills, bios, and GitHub links.
- **Participant Limits**: Project owners can set maximum participant limits, automatically routing overflow users into a Waitlist queue.

## 💻 Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, React-Leaflet
- **Backend**: Node.js, Express, TypeScript, Mongoose
- **Database**: MongoDB
- **File Storage**: Multer (Local static serving)
- **Routing/Maps**: Leaflet.js, OSRM (Open Source Routing Machine)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ColabMeet.git
   cd ColabMeet
