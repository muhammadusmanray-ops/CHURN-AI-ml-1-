# Use Node.js LTS
FROM node:20

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the frontend (optional, since user wants to use Vercel, but good to have)
RUN npm run build

# Expose port (HF uses 7860)
ENV PORT=7860
EXPOSE 7860

# Start the server
CMD ["npm", "run", "dev"]
