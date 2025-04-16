# Stage 1: Frontend Build  
FROM node:18-alpine AS frontend-build  
WORKDIR /app/frontend  

# Copy frontend package files  
COPY frontend/package*.json ./  

# Install frontend dependencies  
RUN npm install  

# Copy frontend source code  
COPY frontend/ .  

# Build frontend assets  
RUN npm run build  

# Stage 2: Backend Build  
FROM node:18-alpine AS backend-build  
WORKDIR /app/backend  

# Copy backend package files  
COPY backend/package*.json ./  

# Install backend dependencies  
RUN npm install  

# Copy backend source code  
COPY backend/ .  

# Final Stage  
FROM node:18-alpine  
WORKDIR /app  

# Install serve for frontend  
RUN npm install -g serve  

# Copy built frontend  
COPY --from=frontend-build /app/frontend/build ./frontend/build  

# Copy backend  
COPY --from=backend-build /app/backend ./backend  

# Install concurrently to run multiple commands  
RUN npm install -g concurrently  

# Expose ports for frontend and backend  
EXPOSE 5000 3000  

# Create a startup script  
RUN echo "#!/bin/sh" > /app/start.sh && \
    echo "cd /app/backend && npm start & " >> /app/start.sh && \
    echo "cd /app/frontend && npx serve -s build -l 3000" >> /app/start.sh && \
    chmod +x /app/start.sh  

# Set environment to production  
ENV NODE_ENV=production  

# Use the startup script as the entrypoint  
CMD ["/bin/sh", "/app/start.sh"]  