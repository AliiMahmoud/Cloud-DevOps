# Exercise: Create a CI Pipeline

> Build a simple Continuous Integration pipeline using `CircleCI`. We have a project that needs to be compiled, tested, and audited for security vulnerabilities. Let's get started!


## Project structure
```
.
├── .circleci
│   └── config.yml
├── .gitignore
├── README.md
├── src
│   ├── index.js
│   └── tests
│       └── testData.js
│   └── ...
├── package.json
├── package-lock.json
```

## Pipeline Stages

    it's consisted of one workflow and 3 main stages
        - Build
        - Test
        - Analyze

- ### choose the executor (docker image)
    we can choose a light-weight node image as 
    ```yaml
    docker:
      - image: circleci/node:13.8.0
    ```
    And as we'll use this in the 3 stage so lets follow the DRY(Done Repeat Yourself) principle and create anchor with alias to reference it later
    ```yaml
    default_container: &container
      docker:
        - image: circleci/node:13.8.0
    ```
- ### Creating the first job(stage) build
    In order to build this simple node app we'll install its dependencies then build it and cache the node nodules to use use then in another job. 
    ```yaml
      build:
        <<: *container # referencing the docker anchor 
        steps:
          - checkout # copying the code to the container
          - run: npm i # install dep
          - save_cache:
             key: "npm-packages"  
             paths:
               - /src/node-modules
    ``` 
- ### Test stage
    in this stage we'll perform a simple test written in `/src/tests/testdata.js` file using javascript testing framework called `jest`, but first let's configure the test script in `package.json` 
        - install jest using `npm install jest --save-dev`
        - under the script map in package.json file add `"test": "jest"` 
        - And now configure jest to match tests location
    ```json
    {
        ...
        "main": "index.js",
        "scripts": {
            "test": "jest",
            "start": "node src/index.js"
        },
        "jest": {
            // here to match testing dir(tests) with all(*) tests in it
            "testMatch": ["<rootDir>/src/tests/**"]
  },
    ```
    Now we're ready to write our test stage with restoring the cache already stored in the build job
    ```yaml
    # Testing stage
    test:
        <<: *container
        steps:
          - checkout
          - restore_cache:
              keys: ['npm-packages']
          - run: npm run test
    ``` 

- ### analyze stage
    This stage is for performing dependency vulnerability checks using the script  `npm audit` instead of `npm run test`


    #### we could merge these jobs into one as they are very little, but in real scenarios the stages are more complex 

The last thing left is creating the order of the execution (workflow)

## The Workflow 
 
 In order to tell a stage(job) to wait for another job we use `requires` as we want to perform test after build then doing the analysis.
```yaml
# The pipeline's workflow
# build -> test -> analysis
workflows:
  pipeline:
    jobs:
      - build
      - test:
          requires: [build]
      - analyze:
          requires: [test]
```


