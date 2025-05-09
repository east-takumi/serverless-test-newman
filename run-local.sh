#!/bin/bash

# 既存のStep Functions Localコンテナを停止・削除
echo "既存のStep Functions Localコンテナをクリーンアップしています..."
docker stop stepfunctions-local 2>/dev/null || true
docker rm stepfunctions-local 2>/dev/null || true

# Step Functions Localを起動
echo "Step Functions Localを起動しています..."
docker run -d -p 8083:8083 --name stepfunctions-local \
  -e AWS_ACCESS_KEY_ID=dummy \
  -e AWS_SECRET_ACCESS_KEY=dummy \
  -e AWS_REGION=us-east-1 \
  -e LAMBDA_ENDPOINT=http://host.docker.internal:3001 \
  -e LAMBDA_FORWARD_REQUEST=1 \
  -e STEP_FUNCTIONS_ENDPOINT=http://localhost:8083 \
  -e SFN_MOCK_CONFIG='{"lambdaEndpoint":"http://host.docker.internal:3001"}' \
  -e WAIT_TIME_SCALE=0.1 \
  -e SFN_IAM_ROLE_ARN_PATTERN='arn:aws:iam::123456789012:role/.*' \
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
DOCKER_HOST_IP=host.docker.internal node tests/setup-local-stepfunctions.js

# テストを実行
echo "テストを実行しています..."
newman run tests/postman/serverless-test-collection.json -e tests/postman/environment.json

# プロセスをクリーンアップ
echo "クリーンアップしています..."
kill $LAMBDA_PID
docker stop stepfunctions-local
docker rm stepfunctions-local

echo "完了しました"
