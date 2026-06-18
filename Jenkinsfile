pipeline {
    agent any
    environment {
        IMAGE_NAME = "mysite"
        CONTAINER_NAME = "mysite-container"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$BUILD_NUMBER .'
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true
                    docker run -d --name $CONTAINER_NAME -p 80:80 $IMAGE_NAME:$BUILD_NUMBER
                '''
            }
        }
    }
}
