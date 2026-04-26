FROM maven:3.9.6-eclipse-temurin-8 AS build

WORKDIR /app

ARG API_BUILD_MAX_HEAP_MB=384
# Cap Maven heap so backend and frontend builds do not contend for all host RAM.
ENV MAVEN_OPTS=-Xmx${API_BUILD_MAX_HEAP_MB}m

COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:8-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
