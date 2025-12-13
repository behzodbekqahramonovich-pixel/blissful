FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install

# Copy project
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
