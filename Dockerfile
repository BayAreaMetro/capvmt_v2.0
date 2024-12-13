# stage 1
FROM node:14-alpine AS my-app-build
RUN apk add --no-cache wget autoconf automake file build-base nasm musl libpng-dev zlib-dev
WORKDIR /app
COPY package*.json ./
RUN npm config set unsafe-perm true
RUN npm i -g node-gyp
RUN npm install
RUN npm install gulp-cli -g
RUN npm install gulp@4 -D
RUN npm install --global --unsafe-perm yo
RUN npm install generator-angular-fullstack@4.2.2
RUN npm install --global --unsafe-perm yo
RUN npm install generator-angular-fullstack@4.2.2
COPY . .
CMD ["gulp", "serve"]


