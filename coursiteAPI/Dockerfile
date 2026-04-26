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

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar /app/app.jar

ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
