pipeline {
    agent any
    stages {
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('MySonar') {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=devops-site -Dsonar.sources=."
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sshagent(['vm-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no testing@192.168.18.102"
                            cd ~/app &&
                            git pull origin main &&
                            cp *.html *.css *.js /var/www/html/
                        "
                    '''
                }
            }
        }
    }
}
