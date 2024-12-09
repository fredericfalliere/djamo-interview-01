FROM cirrusci/flutter:3.3.10
WORKDIR /app
COPY . .
RUN flutter pub get
EXPOSE 8080
CMD ["flutter", "run", "--web-server", "--web-port=8080", "--no-sound-null-safety"]