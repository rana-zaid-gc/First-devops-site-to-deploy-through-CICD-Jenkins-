pipeline {
    agent any
    stages {
        stage('Deploy to VM') {
            steps {
                sshagent(['vm-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no linux@192.168.18.35 "
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