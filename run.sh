#!/bin/bash

echo "🚀 Compilando backend..."
cd simuladorfutbol || exit 1
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
  echo "❌ Falló la compilación del backend. Abortando."
  exit 1
fi

echo "✅ Backend compilado."

echo "🔧 Levantando backend..."
cd .. || exit 1
java -jar simuladorfutbol/target/simuladorfutbol-0.0.1-SNAPSHOT.jar --spring.config.location=file:///C:/Users/Juan/SimuladorFutbol/config/ &
BACK_PID=$!

echo "🌐 Levantando frontend..."
cd simuladorfutbol-front || exit 1
npm start

echo "🛑 Finalizando backend..."
kill $BACK_PID
