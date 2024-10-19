### `.env`
To use this part of the app you have to configure a .env file in the root of this module (./Backend)\
The necesary content is:

```bash
NODE_ENV=your_enviroment
PORT=your_port

# Database connection
MONGODB_CREDENTIALS="mongodb+srv://your_user:your_password@your_server/your_database?retryWrites=true&w=majority"

# Secret seed to password
SECRET_SEED="your_seed"

# Session
SESSION_DURATION="1h"

# API
API_TOKEN="your_api_token"
```



# Nodejs FES Template

# Environment vars
This project uses the following environment variables:

| Name                          | Description                         | Default Value                                  |
| ----------------------------- | ------------------------------------| -----------------------------------------------|
|NODE_ENV           | App enviroment            | "*"      |
|PORT           | Port            | "*"      |
|MONGODB_CREDENTIALS           | MongoDB Data            | ""mongodb+srv://your_user:your_password@your_server/your_database?retryWrites=true&w=majority""      |
|SECRET_SEED           | Seed            | "*"      |
|SESSION_DURATION           | Web session duration            | "?h"      |
|API_TOKEN           | Api token            | "*"      |


# Pre-requisites
- Install [Node.js](https://nodejs.org/) version 20.0.0


# Getting started
- Clone the repository
```
git clone  https://github.com/ShunTr-dev/dexmate-shop-backend
```
- Install dependencies
```
cd <project_name>
npm install
```
- Build and run the project
```
npm start
```

#  Node 
The main purpose of this repository is to show a project setup and workflow for showcase.


## Project Structure
The folder structure of this app is explained below:

| Name | Description |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **dist**                 | Contains the distributable (or output) from your TypeScript build.  |
| **node_modules**         | Contains all  npm dependencies                                                            |
| **src**                  | Contains  source code that will be compiled to the dist dir                               |
| **configuration**        | Application configuration including environment-specific configs 
| **src/controllers**      | Controllers define functions to serve various express routes. 
| **src/lib**              | Common libraries to be used across your app.  
| **src/middlewares**      | Express middlewares which process the incoming requests before handling them down to the routes
| **src/routes**           | Contain all express routes, separated by module/area of application                       
| **src/models**           | Models define schemas that will be used in storing and retrieving data from Application database  |
| **src/monitoring**      | Prometheus metrics |
| **src**/index.ts         | Entry point to express app                                                               |
| package.json             | Contains npm dependencies as well as [build scripts](#what-if-a-library-isnt-on-definitelytyped)   | tsconfig.json            | Config settings for compiling source code only written in TypeScript    
| tslint.json              | Config settings for TSLint code style checking                                                |

## Building the project

### Running the build
All the different build steps are orchestrated via [npm scripts](https://docs.npmjs.com/misc/scripts).
Npm scripts basically allow us to call (and chain) terminal commands via npm.

| Npm Script | Description |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `start`                   | Runs full build and runs node on dist/index.js. Can be invoked with `npm start`                  |
| `build:copy`                   | copy the *.yaml file to dist/ folder      |
| `build:live`                   | Full build. Runs ALL build tasks       |
| `build:dev`                   | Full build. Runs ALL build tasks with all watch tasks        |
| `dev`                   | Runs full build before starting all watch tasks. Can be invoked with `npm dev`                                         |
| `test`                    | Runs build and run tests using mocha        |
| `lint`                    | Runs TSLint on project files       |

