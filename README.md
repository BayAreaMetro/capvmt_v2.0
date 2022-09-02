# capvmt_v2.0
Climate Action Plan VMT Data Portal (Version 2)

## User Roles and Responsibilities

- WebDev (MZ)
- UI Requirements (WL/KS)
- 
## Requirements

### Front End Requirements
- [ ] initial environment set up (MZ)
- [ ] Complete front end page buildout (WL)

### Data Updates

See the README in the [etl folder](https://github.com/BayAreaMetro/capvmt_v2.0/tree/main/etl)


This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 4.2.2.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Extension for Visual Code](https://code.visualstudio.com/docs/containers/overview)

### Developing

  1. Build Docker Image
     `docker build -t capvmt . `
  2. Create "dist" folder at root of the project if it doesn't already exist
  3. Copy [local.env.js](https://mtcdrive.box.com/s/3mupwj06prg1wwhs5lc34ehv1lqx4x60) file to server/config and rename to local.env.js
  4. Create Docker Container
    ` docker run -dp "3000:3000"  -w /app -v "$(pwd)/client:/app/client" -v "$(pwd)/server:/app/server" -v "$(pwd)/dist:/app/dist capvmt `
  5. Container should now be running in Docker Desktop. Open local browser at localhost:3000


## Build & development

In Docker terminal, run `gulp build` for building and `gulp serve` for preview.

## Testing

In Docker terminal, running `npm test` will run the unit tests with karma.

## Deployment

After running `gulp build`, compress all files in dist/server into a zip file. In AWS EB environment, select `Upload and Deploy`, and point to zip file in dist/server
