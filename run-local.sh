#!/bin/bash

# Step Functions Localを起動
echo "Step Functions Localを起動しています..."
docker run -d -p 8083:8083 --name stepfunctions-local \
  -e LAMBDA_ENDPOINT=http://host.docker.internal:3001 \
  -e LAMBDA_FORWARD_REQUEST=1 \
  -e STEP_FUNCTIONS_ENDPOINT=http://localhost:8083 \
  --add-host=host.docker.internal:host-gateway \
  amazon/aws-stepfunctions-local

# コンテナが起動するまで待機
echo "Step Functions Localの起動を待機しています..."
sleep 5

# SAMプロジェクトをビルド
echo "SAMプロジェクトをビルドしています..."
sam build

# Lambda関数をローカルで起動
echo "Lambda関数を起動しています..."
sam local start-lambda &
LAMBDA_PID=$!

# Lambda関数が起動するまで待機
echo "Lambda関数の起動を待機しています..."
sleep 5

# Step Functions環境をセットアップ
echo "Step Functions環境をセットアップしています..."
DOCKER_HOST_IP=host.docker.internal node tests/setup-local-stepfunctions.js &
SETUP_PID=$!

# セットアップが完了するまで待機
echo "セットアップの完了を待機しています..."
sleep 5

# テストを実行
echo "テストを実行しています..."
newman run tests/postman/serverless-test-collection.json -e tests/postman/environment.json

# プロセスをクリーンアップ
echo "クリーンアップしています..."
kill $LAMBDA_PID
kill $SETUP_PID
docker stop stepfunctions-local
docker rm stepfunctions-local

echo "完了しました"
