# Imagen del backend para Render (o cualquier servicio que ejecute Docker).
#
# Etapa 1: compila el JAR con el wrapper de Gradle del proyecto.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Primero solo los archivos de Gradle: si no cambian, Docker reutiliza la capa con las
# dependencias ya descargadas y el build siguiente es mucho más rápido.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null

COPY src src
# Las pruebas ya corren en local/CI; aquí solo se empaqueta.
RUN ./gradlew --no-daemon bootJar -x test

# Etapa 2: solo el JRE y el JAR (imagen mucho más chica que con el JDK y Gradle).
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/app.jar app.jar

# El plan gratis de Render da 512 MB: la JVM usa como máximo el 75 % para el heap y
# SerialGC, que es el recolector que menos memoria gasta con una sola CPU.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"

# Render indica el puerto en la variable PORT (application.properties la lee).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
