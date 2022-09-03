# Exercise: Promote to Production

> Write a set of jobs that promotes a new environment to production and decommissions the old environment in an automated process.

## Prerequisites
You should have finished the previous:
- Exercise: Remote Control Using Ansible
- Exercise: Infrastructure Creation
- Exercise: Config and Deployment, and Rollback


## Note
- The deployment strategy used is green blue. 
- At the beginning, you should create s3 bucket manually with static web hosting allowed and upload index.html  
- Run the cloudformation CDN creation script manually to create the initial stack providing the name of bucket created

    ```bash
    aws cloudformation deploy \
    --template-file cloudfront.yml \
    --stack-name production-distro \
    --parameter-overrides PipelineID="${S3_BUCKET_NAME}"
    ``` 
- Now we can run our pipeline normally

- In order to achieve the blue green deployment we split our infrastructure into two scripts, one for the deployment, and the second for the router to switch from the blue version to the green in this case it's the(CDN) - changing the cloud-front origin. 

## Main Jobs
- create_and_deploy_front_end
- promote_to_production
- get_last_deployment_id
- clean_up_old_release based on prev job ['get_last_dep_id']

    