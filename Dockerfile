# Stage 1: build do React (Create React App + craco)
FROM node:20-alpine AS builder

WORKDIR /app

# Variáveis de build para API e Socket.io (prefixo /backend no nginx)
ARG REACT_APP_API_URL=/backend
ARG REACT_APP_SOCKET_PATH=/backend/socket.io
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_PATH=$REACT_APP_SOCKET_PATH

COPY package.json package-lock.json ./
RUN npm ci

COPY public ./public
COPY src ./src
COPY craco.config.js ./

RUN npm run build

# Stage 2: nginx servindo o build estático + proxy para a API
FROM nginx:alpine

# Copiar build do stage anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Config do nginx: SPA + proxy /backend -> api:3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
