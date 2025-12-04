# Geo-Fence Backend

Spring Boot REST API for trajectory-based AOI prediction.

## Quick Start

### Using Docker (Recommended)

```bash
docker compose up -d
```

This starts:
- Spring Boot app on port 8080
- PostgreSQL on port 5432
- Redis on port 6379

### Running Locally

1. Ensure PostgreSQL and Redis are running
2. Run: `mvn spring-boot:run`

## API Endpoints

- `POST /api/trajectory/{userId}/add` - Add single point
- `POST /api/trajectory/{userId}/batch` - Add multiple points
- `GET /api/trajectory/{userId}/latest` - Get latest points
- `GET /api/aoi` - List AOIs
- `POST /api/aoi` - Create AOI

## Configuration

Edit `src/main/resources/application.yml` for database and Redis settings.

## Building

```bash
mvn clean package
```

The JAR will be in `target/geo-fence-1.0.0.jar`

## Model Location

The TensorFlow SavedModel must be in:
```
src/main/resources/exported_geofence_model/
```

See main README.md for model export instructions.
