# stage 1

FROM node:14-alpine AS my-app-build
WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
RUN npm install gulp-cli -g
RUN npm install gulp@4 -D
COPY . .
CMD ["gulp", "serve"]

