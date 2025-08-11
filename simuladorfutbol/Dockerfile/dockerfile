# -------- Stage 1: build con Maven + JDK 17 --------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# compila y empaqueta sin tests
RUN mvn -q -DskipTests clean package

# -------- Stage 2: runtime con JRE 17 --------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Render expone un PORT; Spring Boot debe escuchar ahí
ENV PORT=8080
EXPOSE 8080

# Copiamos el jar construido
COPY --from=build /app/target/simuladorfutbol-0.0.1-SNAPSHOT.jar /app/app.jar

# Ajustes de memoria recomendados para la instancia Free de Render
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"

# Usamos sh -c para expandir ${PORT}
CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]
