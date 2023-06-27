# YTDL-WEB

Web interface for [YTDL API](https://github.com/deepaerial/ytdl-api).

![YTDL Web Application](docs/web.png)

##  Requirements

* Node v18

## Installation
Run command below to install application locally.
```shell
$ npm install
```
## Configuration
Create `.env` file with variable referencing API's url. Example:
```
API_URL=http://localhost:8080
```

## Running application locally
```
$ npm run devserver
```

App should be automatically opened on http://localhost:8080

## Deploying on Fly.io
```shell
$ fly deploy --build-arg API_URL=https://link-to-ytdl-backend.api
```