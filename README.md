# CI/CD Pipeline: Automated Deployment with Jenkins, Docker & Nginx
A CI/CD pipeline that automatically builds and deploys a static website to a containerized Nginx server on a Linux VM whenever code is pushed to GitHub. Jenkins detects new commits, connects to the deployment server over SSH, rebuilds the Docker image, and redeploys the running container — turning a git push into a live website update with no manual steps.

This was my first hands-on DevOps project, built end to end to learn how the core pieces of a deployment pipeline fit together.
┌──────────┐     ┌──────────────────┐     ┌──────────────────────────────┐
  │  GitHub  │────▶│ Jenkins (Poll SCM)│────▶│            Linux VM           │
  │  (code)  │     │   on host machine │ SSH │  docker build → Nginx container│
  └──────────┘     └──────────────────┘     └──────────────────────────────┘
                                                            │
                                                            ▼
                                                      Live Website

Flow: git push → GitHub → Jenkins polls and detects the change → Jenkins SSHes into the VM → pulls latest code → builds a Docker image → replaces the running Nginx container → site is live.


How It Works

The pipeline is defined in a Jenkinsfile (Pipeline-as-Code) and runs these stages:


Checkout — Jenkins pulls the latest code from the GitHub repository.
Deploy to VM — Using stored SSH credentials, Jenkins connects to the Linux VM and:

Pulls the latest code into the deployment directory
Builds a fresh Docker image (FROM nginx:alpine + the site files)
Stops and removes the previous container
Runs the new container, serving the site on port 80





Trigger: Jenkins uses Poll SCM to check GitHub for new commits every 2 minutes, so deployments happen automatically after each push.


Jenkinsfile

pipeline {
    agent any
    stages {
        stage('Deploy to VM') {
            steps {
                sshagent(['vm-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no linux@<VM_IP> "
                            cd ~/app &&
                            git pull origin main &&
                            docker build -t mysite:${BUILD_NUMBER} . &&
                            docker stop mysite-container || true &&
                            docker rm mysite-container || true &&
                            docker run -d --name mysite-container -p 80:80 mysite:${BUILD_NUMBER}
                        "
                    '''
                }
            }
        }
    }
}



Dockerfile

FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80

Challenges I Solved

Building this end to end meant debugging real infrastructure problems — not just following a tutorial. A few worth highlighting:


Jenkins repository GPG key failure — The official Jenkins apt repository rejected installation due to an expired/mismatched signing key (NO_PUBKEY). I diagnosed it by inspecting the downloaded key with gpg --show-keys, confirmed it was expired, and worked around it by installing Jenkins via the official Docker image instead — sidestepping the broken Debian repo entirely.
Host vs. container Nginx port conflict — My site appeared to "work" but never reflected new deployments. I traced it with ss -tlnp and docker ps and discovered a host-installed Nginx was silently serving port 80 instead of my Docker container — and the container wasn't even running. Removing the host Nginx freed port 80 so the containerized Nginx could correctly serve the deployed site.
SSH key bridge between Jenkins and the VM — Moving Jenkins to the host meant it had to deploy across machines over SSH. I set up passwordless SSH for the dedicated jenkins system user (separate from my login user), generated a key pair, installed the public key in the VM's authorized_keys, and stored the private key as a Jenkins credential — debugging an error in libcrypto (malformed pasted key) and a Permission denied (publickey) (missing public key on the VM) along the way.
Changing VM IP breaking the pipeline — The bridged-network VM received a new DHCP IP after reboot, breaking the hardcoded SSH target. I learned to detect the current IP and update the pipeline, and documented setting a static IP as the proper long-term fix.


Screenshots





Successful Jenkins build (green):


<img width="1918" height="823" alt="image" src="https://github.com/user-attachments/assets/1b4451ee-e675-4559-98f1-b31d9031f2d3" />

