FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Env & port (platforms like Render/Heroku set PORT)
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app.js"]
