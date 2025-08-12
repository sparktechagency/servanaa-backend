FROM node:22  AS builder
# RUN apk add --no-cache python3 make g++ 
WORKDIR /app

COPY package.json  ./

# RUN yarn cache clean
RUN npm cache clean --force

# RUN yarn install --frozen-lockfile
# RUN npm install --production
RUN npm install

COPY . .

# Increase memory limit for npm build process
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

FROM node:22 

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5002

CMD ["npm","run", "start:prod"]