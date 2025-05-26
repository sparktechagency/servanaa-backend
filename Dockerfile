FROM node:22 AS builder

WORKDIR /app

COPY package.json ./ 

RUN npm cache clean --force
RUN npm install

COPY . .

RUN npm run build 

# Temporarily skip the build to bypass TypeScript error
# RUN npm run build 

FROM node:22

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 5001

CMD ["npm", "start"]
