# -----------------------------------------
# 🐳 Employee Taskboard Dockerfile
# -----------------------------------------

# 1. Base image
FROM node:18-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# 4. Copy project files
COPY . .

# 5. Expose the port (same as your server.js PORT)
EXPOSE 3000

# 6. Set environment variables (can also be passed from docker-compose or CLI)
ENV NODE_ENV=production

# 7. Start the server
CMD ["node", "server.js"]
