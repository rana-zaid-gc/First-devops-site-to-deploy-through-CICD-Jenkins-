pipeline {
    agent any
    stages {
        stage('Deploy to VM') {
            steps {
                sshagent(['vm-ssh']) {
                    sh '''
                        ssh -p 2222 -o StrictHostKeyChecking=no testing@localhost "
                            cd ~/app &&
                            git pull origin main &&
                            cp -r ~/app/*.html ~/app/*.css ~/app/*.js /var/www/html/ &&
                            echo 'Deployed successfully'
                        "
                    '''
                }
            }
        }
    }
}