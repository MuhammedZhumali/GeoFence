# Geo-Fence: Trajectory-Based Area of Interest Prediction

A machine learning system that predicts whether a trajectory will enter a predefined Area of Interest (AOI) using deep learning. The system consists of a Python-based model training pipeline, a Spring Boot REST API for real-time predictions, and a modern React frontend for visualization and device management.

## 🎯 Overview

This project uses a CNN-GRU neural network to analyze trajectory patterns and predict future entry into an AOI. The model is trained on real-world GPS trajectory data (Geolife dataset) and deployed as a REST API service with a full-featured web dashboard.

### Key Features

- **Deep Learning Model**: CNN-GRU architecture for sequence prediction
- **REST API**: Spring Boot backend with real-time prediction endpoints
- **Modern Web Dashboard**: React + TypeScript frontend with interactive map visualization
- **Real GPS Tracking**: Browser-based geolocation API integration for live tracking
- **Multiple Device Support**: Manage and track multiple devices simultaneously
- **Interactive Map**: Leaflet-based map with trajectory visualization and starting point selection
- **Trajectory Management**: Redis-based temporary storage for trajectory points
- **Docker Support**: Complete containerized deployment
- **PostgreSQL + PostGIS**: Spatial database for AOI storage (ready for future enhancements)

## 📋 Table of Contents

- [Architecture](#architecture)
- [Model Details](#model-details)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Port 3000)       │
│   - Real GPS Tracking               │
│   - Multiple Device Management      │
│   - Interactive Map Visualization  │
│   - Trajectory & Probability Display│
└────────────┬────────────────────────┘
             │ HTTP REST API
             ▼
┌─────────────────────────────────┐
│   Spring Boot REST API          │
│   (Port 8080)                   │
│   - CORS Enabled                │
├─────────────────────────────────┤
│  GeoController                  │
│    ├─ /api/trajectory/add       │
│    ├─ /api/trajectory/add-batch │
│    ├─ /api/trajectory/latest    │
│    └─ /api/aoi                  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   TrajectoryService             │
│   - Manages trajectory windows  │
│   - Sorts by timestamp          │
└────────┬────────────────────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌──────────────┐  ┌─────────────────┐
│   Redis      │  │  MlInference    │
│   (Cache)    │  │  Service        │
│              │  │  (TensorFlow)   │
└──────────────┘  └────────┬────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ SavedModel   │
                   │ (CPU-ready)  │
                   └──────────────┘
```

## 🧠 Model Details

### Architecture

- **Input**: Trajectory window of 20 points (lat, lon)
- **Layers**:
  1. Conv1D (32 filters, kernel_size=3) - Captures local movement patterns
  2. MaxPooling1D (pool_size=2) - Reduces sequence length
  3. GRU (64 units) - Learns temporal dependencies
  4. Dense (64 units, ReLU) - Feature extraction
  5. Dropout (0.3) - Regularization
  6. Dense (1 unit, Sigmoid) - Binary classification output

### Training

- **Dataset**: Geolife GPS trajectory dataset
- **Window Size**: 20 trajectory points
- **Horizon**: Predicts entry within next 10 points
- **Output**: Probability (0-1) of entering AOI

### What the Probability Represents

The **Intrusion Probability** is the model's prediction that a trajectory will enter a predefined **Area of Interest (AOI)** within the next 10 GPS points, based on the movement patterns observed in the last 20 points.

- **0.0 - 0.3 (0-30%)**: Low Risk - Unlikely to enter an AOI
- **0.3 - 0.7 (30-70%)**: Medium Risk - Possible entry into an AOI
- **0.7 - 1.0 (70-100%)**: High Risk - Very likely to enter an AOI

**Important Notes:**
- The model requires **at least 20 trajectory points** before making predictions (returns 0.0 until then)
- The model was trained on the Geolife dataset and predicts based on learned movement patterns
- Currently, the model doesn't check against user-defined AOIs - it uses patterns learned during training
- Future enhancements will integrate geometric intersection checks with defined AOIs

### Model Export

The model is exported as a TensorFlow SavedModel optimized for CPU inference (no GPU dependencies).

## 📦 Prerequisites

### For Model Training (Python)
- Python 3.12+
- TensorFlow 2.20+
- Keras 3.12+
- NumPy, Pandas, Matplotlib
- Jupyter Notebook

### For Backend (Java)
- Java 17+
- Maven 3.9+
- Docker & Docker Compose (recommended)

### For Frontend (React)
- Node.js 18+
- npm 9+ or yarn
- Modern web browser with geolocation API support

### Services
- PostgreSQL 13+ (with PostGIS extension)
- Redis 7+

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Geo-Fence
```

### 2. Set Up Python Environment (for training)

```bash
cd geodezi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Prepare the Model

If you have a trained model (`best_geofence_model.keras`), export it for CPU inference:

```bash
cd geodezi
python recreate_cpu_model.py
```

This will create `exported_geofence_model/` directory. Copy it to the backend:

```bash
cp -r exported_geofence_model ../backend/src/main/resources/
```

### 4. Set Up Backend with Docker (Recommended)

```bash
cd backend
docker compose up -d
```

This will:
- Build the Spring Boot application
- Start PostgreSQL with PostGIS
- Start Redis
- Start the application on port 8080

### 5. Set Up Frontend

```bash
cd frontend
npm install
```

This will install all frontend dependencies including:
- React 18
- TypeScript
- Vite
- Leaflet & React-Leaflet for maps
- Axios for API calls

### 6. Verify Installation

Check if backend services are running:

```bash
cd backend
docker compose ps
```

You should see:
- `backend-app-1` (Spring Boot)
- `backend-db-1` (PostgreSQL)
- `backend-redis-1` (Redis)

## 💻 Usage

### Training a New Model

1. Place your training data in the `geo-date/Data/` directory (Geolife format)
2. Open `geodezi/geodez.ipynb` in Jupyter
3. Run all cells to train the model
4. Export the model using `recreate_cpu_model.py`

### Running the Backend API

#### Using Docker (Recommended)

```bash
cd backend
docker compose up -d
```

This starts all services (PostgreSQL, Redis, and Spring Boot app).

#### Running Locally

1. Ensure PostgreSQL and Redis are running
2. Update `backend/src/main/resources/application.yml` if needed
3. Run:

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

### Running the Frontend

1. Start the development server:

```bash
cd frontend
npm run dev
```

2. Open your browser to `http://localhost:3000`

3. The frontend will automatically proxy API requests to `http://localhost:8080`

### Using the Web Dashboard

#### Device Management
- **Create Devices**: Click "+ New Device" to create a new tracking device
- **Switch Devices**: Click on any device card to switch between devices
- **Delete Devices**: Click the ✕ button on a device card (at least one device must remain)

#### GPS Tracking
- **Start Tracking**: Click "📍 Start GPS Tracking" - your browser will request location permission
- **Auto-Send**: Select an interval (5s, 10s, 30s, 1min) for automatic position updates
- **Manual Send**: Click "📤 Send Current Position" to manually send your current location
- **Stop Tracking**: Click "⏹ Stop Tracking" when done

#### Starting Point
- **Set from GPS**: Use your current GPS location as starting point
- **Set from Map**: Click "📍 Set Start Point" on the map, then click anywhere on the map
- **Enter Coordinates**: Manually enter latitude and longitude
- **Clear**: Remove the starting point to reset

#### Simulation
- **Add Random Points**: Click "➕ Add Random Point (Simulate)" to generate test trajectory points
- **Note**: Requires a starting point to be set first

#### Viewing Results
- **Map**: Interactive map showing trajectory path, current position, and starting point
- **Probability**: Real-time intrusion probability with color-coded risk levels
  - Green (0-30%): Low Risk
  - Orange (30-70%): Medium Risk
  - Red (70-100%): High Risk
- **Trajectory Table**: View all trajectory points with coordinates and timestamps

## 📡 API Endpoints

### 1. Add Single Trajectory Point

**POST** `/api/trajectory/{objectId}/add`

Adds a single trajectory point and returns prediction if window is complete (requires 20 points).

**Request:**
```json
{
  "lat": 39.9042,
  "lon": 116.4074,
  "timestamp": 1707043200000
}
```

**Response:**
```json
{
  "probability": 0.6262352
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/trajectory/device42/add \
  -H "Content-Type: application/json" \
  -d '{"lat":39.9042,"lon":116.4074,"timestamp":1707043200000}'
```

**Note**: Returns `0.0` probability until 20 points are collected.

### 2. Add Batch of Trajectory Points

**POST** `/api/trajectory/{objectId}/add-batch`

Adds multiple trajectory points at once. Processes each point sequentially.

**Request:**
```json
[
  {"lat": 39.9042, "lon": 116.4074, "timestamp": 1707043200000},
  {"lat": 39.9045, "lon": 116.4078, "timestamp": 1707043260000},
  ...
]
```

**Response:**
```json
{
  "probability": 0.6262352
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/trajectory/device42/add-batch \
  -H "Content-Type: application/json" \
  -d '[{"lat":39.9042,"lon":116.4074,"timestamp":1707043200000}]'
```

### 3. Get Latest Trajectory Points

**GET** `/api/trajectory/{objectId}/latest`

Returns the latest 20 trajectory points for a device.

**Response:**
```json
[
  {"lat": 39.9042, "lon": 116.4074, "timestamp": 1707043200000},
  ...
]
```

**cURL Example:**
```bash
curl http://localhost:8080/api/trajectory/device42/latest
```

### 4. AOI Management

**GET** `/api/aoi` - List all AOIs

**Response:**
```json
[
  {
    "id": 1,
    "name": "Restricted Area",
    "polygonWkt": "POLYGON((...))"
  }
]
```

**POST** `/api/aoi` - Create a new AOI

**Request:**
```json
{
  "name": "Restricted Area",
  "polygonWkt": "POLYGON((lon1 lat1, lon2 lat2, ...))"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Restricted Area",
  "polygonWkt": "POLYGON((...))"
}
```

## 📁 Project Structure

```
Geo-Fence/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   ├── controller/     # REST controllers
│   │       │   ├── service/         # Business logic
│   │       │   ├── repository/     # Data access
│   │       │   ├── models/         # Entity classes
│   │       │   └── config/         # Configuration (CORS, Redis)
│   │       └── resources/
│   │           ├── application.yml # App configuration
│   │           └── exported_geofence_model/  # ML model
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pom.xml
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── component/          # React components
│   │   │   ├── MapView.tsx    # Interactive map
│   │   │   ├── DeviceManager.tsx  # Device management
│   │   │   ├── ProbabilityCard.tsx # Probability display
│   │   │   └── TrajectorPlan.tsx  # Trajectory table
│   │   ├── hooks/
│   │   │   └── useGpsTracking.ts  # GPS tracking hook
│   │   ├── api/
│   │   │   └── backend.tsx    # API client
│   │   ├── App.tsx            # Main application
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts         # Vite configuration
│   └── tsconfig.json          # TypeScript config
│
├── geodezi/                    # Model training
│   ├── geodez.ipynb           # Main training notebook
│   ├── recreate_cpu_model.py  # Model export script
│   ├── best_geofence_model.keras  # Trained model
│   ├── requirements.txt
│   └── exported_geofence_model/   # Exported model
│
└── README.md
```

## 🔧 Development

### Building the Application

```bash
cd backend
mvn clean package
```

### Running Tests

```bash
mvn test
```

### Viewing Logs

```bash
# Docker logs
docker compose logs -f app

# Or for specific service
docker compose logs app --tail 50
```

### Database Access

```bash
# Connect to PostgreSQL
docker compose exec db psql -U geo -d geodb

# Connect to Redis CLI
docker compose exec redis redis-cli
```

## 🐛 Troubleshooting

### Port 8080 Already in Use

**Solution:**
```bash
# Stop Docker container
docker compose stop app

# Or use a different port
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

### Model Not Found Error

**Solution:**
1. Ensure `exported_geofence_model/` exists in `backend/src/main/resources/`
2. Rebuild Docker image: `docker compose build app`
3. Check model path in `MlInferenceService.java`

### Redis Connection Error

**Solution:**
1. Verify Redis is running: `docker compose ps redis`
2. Check `application.yml` Redis configuration
3. Ensure Docker network is correct

### CORS Errors

**Solution:**
CORS is configured in `backend/src/main/java/config/CorsConfig.java`. If you're accessing from a different origin:
1. Add your origin to the allowed origins list
2. Rebuild the Docker container: `docker compose build app && docker compose up -d app`

### Frontend Build Errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### GPS Not Working

**Possible Causes:**
1. Browser doesn't support geolocation API (use modern browser)
2. Location permission denied (check browser settings)
3. HTTPS required (some browsers require HTTPS for geolocation)
4. Try using HTTP on localhost (usually works)

### CudnnRNN Error (GPU Operations)

**Solution:**
The model must be exported for CPU. Use `recreate_cpu_model.py`:

```bash
cd geodezi
python recreate_cpu_model.py
cp -r exported_geofence_model ../backend/src/main/resources/
```

### Low Prediction Probabilities

**Possible Causes:**
1. Trajectory points not sorted chronologically (handled automatically)
2. Trajectory doesn't match training data patterns
3. Model needs retraining with more data
4. Need at least 20 trajectory points before predictions start (returns 0.0 until then)

## 📝 Configuration

### Backend Application Properties

Edit `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/geodb
    username: geo
    password: geopass
  
  redis:
    host: localhost
    port: 6379

server:
  port: 8080
```

### Frontend Configuration

Edit `frontend/vite.config.ts` to change the API proxy:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### Docker Environment Variables

Override in `docker-compose.yml`:

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/geodb
  SPRING_REDIS_HOST: redis
  SPRING_REDIS_PORT: 6379
```

### CORS Configuration

CORS is configured in `backend/src/main/java/config/CorsConfig.java`. By default, it allows:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

To add more origins, edit the `CorsConfig.java` file.

# ^^

---

**Note**: This project uses TensorFlow Java 0.5.0 for model inference. Ensure your model is exported in CPU-compatible format to avoid GPU operation errors.

