FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN mkdir -p /app/uploads
COPY --from=build /workspace/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
