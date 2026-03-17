FROM node:20-alpine

# Use environment variable for port
ENV PORT=5000

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD [ "npm", "start" ]
