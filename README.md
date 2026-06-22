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


Live website:


<img width="1919" height="941" alt="image" src="https://github.com/user-attachments/assets/8ec9fb9c-41c1-4d63-a3da-b3eb9162b082" />


What I'd Improve for Production

This is a local learning project. To make it production-ready I would:


Deploy to a cloud server (AWS EC2 / DigitalOcean) instead of a local VM
Replace Poll SCM with a GitHub webhook for instant deploys
Assign a static IP so the pipeline never breaks on reboot
Add a build/test stage before deployment
Use Docker Compose (and eventually Kubernetes) for orchestration
Add monitoring and logging


What I Learned


How a CI/CD pipeline connects source control, build automation, and deployment
Containerizing and serving a web app with Docker + Nginx
Configuring secure, passwordless SSH between machines
Writing Pipeline-as-Code with a Jenkinsfile
Systematically debugging infrastructure issues (networking, ports, keys, services)


"What I'd Improve"

## CI/CD Triggers: Webhooks & Polling

This pipeline supports two ways of automatically triggering a deployment when code is pushed to GitHub. Understanding both — and when to use each — was part of building this project.

### Option 1: Poll SCM (interval-based)

Jenkins periodically *asks* GitHub whether there are new commits.

- **Schedule used:** `H/2 * * * *` (checks every ~2 minutes)
- **How it works:** Jenkins runs a check on a timer; if it finds a new commit, it triggers a build.
- **Pros:** Works entirely on a local/private network — no public access needed.
- **Cons:** Up to a 2-minute delay; Jenkins checks repeatedly even when nothing changed.

### Option 2: Webhooks (event-based) — instant deploys

GitHub *notifies* Jenkins the instant a push happens, by sending an HTTP POST to a webhook URL.

- **How it works:** On every push, GitHub sends a payload to Jenkins' `/github-webhook/` endpoint, which immediately triggers a build.
- **Pros:** Near-instant deployment (seconds, not minutes); no wasted polling.
- **Cons:** Jenkins must be reachable from the public internet.

### The local-setup challenge (and how I solved it)

Since Jenkins runs locally (not on a public server), GitHub couldn't reach it directly at `localhost:8080`. To bridge this, I used **ngrok** to create a secure public tunnel to the local Jenkins instance:

```
GitHub (push) → https://<id>.ngrok-free.dev/github-webhook/ → [ngrok tunnel] → localhost:8080 (Jenkins) → build
```

**Setup steps:**
1. Exposed local Jenkins with `ngrok http 8080`
2. Added a GitHub webhook → Payload URL: `https://<ngrok-url>/github-webhook/`, content type `application/json`, push events
3. Installed the **GitHub Integration** plugin in Jenkins (provides the `/github-webhook/` endpoint)
4. Enabled **"GitHub hook trigger for GITScm polling"** in the job's triggers
5. Set the job's Pipeline definition to **"Pipeline script from SCM"** so Jenkins tracks the repo (required for the webhook trigger to act on changes)

I verified delivery via GitHub's **Recent Deliveries** panel (looking for a `200` response).


<img width="1475" height="912" alt="image" src="https://github.com/user-attachments/assets/dc57d60f-5b30-4d25-8ee9-153317342a09" />


### Which to use when

| Situation | Recommended trigger |
|-----------|--------------------|
| Local / private Jenkins, learning | Poll SCM |
| Public/cloud Jenkins, real workflow | Webhook |
| Need instant deploys | Webhook |
| No public access available | Poll SCM |

> **Note:** ngrok is a local-development workaround. On a cloud-hosted Jenkins with a public IP, webhooks work directly with no tunnel — which is the proper production approach. 
