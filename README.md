# Geo-Fence: Trajectory-Based Area of Interest Prediction

A machine learning system that predicts whether a trajectory will enter a predefined Area of Interest (AOI) using deep learning. The system consists of a Python-based model training pipeline and a Spring Boot REST API for real-time predictions.

## 🎯 Overview

This project uses a CNN-GRU neural network to analyze trajectory patterns and predict future entry into an AOI. The model is trained on real-world GPS trajectory data (Geolife dataset) and deployed as a REST API service.

### Key Features

- **Deep Learning Model**: CNN-GRU architecture for sequence prediction
- **REST API**: Spring Boot backend with real-time prediction endpoints
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
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────┐
│   Spring Boot REST API          │
│   (Port 8080)                  │
├─────────────────────────────────┤
│  GeoController                  │
│    ├─ /api/trajectory/add       │
│    └─ /api/trajectory/batch     │
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

### 5. Verify Installation

Check if services are running:

```bash
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

### Running the API

#### Using Docker (Recommended)

```bash
cd backend
docker compose up -d app
```

#### Running Locally

1. Ensure PostgreSQL and Redis are running
2. Update `backend/src/main/resources/application.yml` if needed
3. Run:

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

## 📡 API Endpoints

### 1. Add Single Trajectory Point

**POST** `/api/trajectory/{userId}/add`

Adds a single trajectory point and returns prediction if window is complete.

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
curl -X POST http://localhost:8080/api/trajectory/user123/add \
  -H "Content-Type: application/json" \
  -d '{"lat":39.9042,"lon":116.4074,"timestamp":1707043200000}'
```

### 2. Add Batch of Trajectory Points

**POST** `/api/trajectory/{userId}/batch`

Adds multiple trajectory points at once.

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
curl -X POST http://localhost:8080/api/trajectory/user123/batch \
  -H "Content-Type: application/json" \
  -d '[{"lat":39.9042,"lon":116.4074,"timestamp":1707043200000}]'
```

### 3. Get Latest Trajectory Points

**GET** `/api/trajectory/{userId}/latest`

Returns the latest trajectory points for a user.

**Response:**
```json
[
  {"lat": 39.9042, "lon": 116.4074, "timestamp": 1707043200000},
  ...
]
```

### 4. AOI Management

**GET** `/api/aoi` - List all AOIs
**POST** `/api/aoi` - Create a new AOI
**GET** `/api/aoi/{id}` - Get AOI by ID

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
│   │       │   └── config/         # Configuration
│   │       └── resources/
│   │           ├── application.yml # App configuration
│   │           └── exported_geofence_model/  # ML model
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pom.xml
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

## 📝 Configuration

### Application Properties

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

### Docker Environment Variables

Override in `docker-compose.yml`:

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/geodb
  SPRING_REDIS_HOST: redis
  SPRING_REDIS_PORT: 6379
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Specify your license here]

## 🙏 Acknowledgments

- Geolife GPS Trajectory Dataset
- TensorFlow Java API
- Spring Boot Framework

## 📧 Contact

[Your contact information]

---

**Note**: This project uses TensorFlow Java 0.5.0 for model inference. Ensure your model is exported in CPU-compatible format to avoid GPU operation errors.

