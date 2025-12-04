# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the JAR from build stage
COPY --from=build /app/target/geo-fence-1.0.0.jar app.jar

# Copy the ML model
COPY src/main/resources/exported_geofence_model /app/exported_geofence_model

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
