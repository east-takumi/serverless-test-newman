# AWS Step Functions Local のセットアップと使用方法

このプロジェクトでは、AWS Step Functions Localを使用して、実際のAWS環境にデプロイすることなくStep Functionsのワークフローをテストします。

## 前提条件

- Docker（Step Functions Localコンテナを実行するため）
- Node.js
- AWS SAM CLI

## ローカル環境でのセットアップ

### 簡易実行スクリプトを使用する方法

プロジェクトルートにある `run-local.sh` スクリプトを使用すると、すべての環境を一度に起動してテストを実行できます：

```bash
# スクリプトに実行権限を付与（初回のみ）
chmod +x run-local.sh

# スクリプトを実行
./run-local.sh
```

このスクリプトは以下の処理を自動的に行います：
1. Step Functions Localコンテナの起動
2. SAMプロジェクトのビルド
3. Lambda関数のローカル実行環境の起動
4. Step Functions環境のセットアップ
5. Newmanテストの実行
6. 使用したリソースのクリーンアップ

### 手動でセットアップする方法

#### 1. Step Functions Localコンテナの起動

```bash
docker run -d -p 8083:8083 --name stepfunctions-local \
  -e LAMBDA_ENDPOINT=http://host.docker.internal:3001 \
  -e LAMBDA_FORWARD_REQUEST=1 \
  -e STEP_FUNCTIONS_ENDPOINT=http://localhost:8083 \
  --add-host=host.docker.internal:host-gateway \
  amazon/aws-stepfunctions-local
```

#### 2. SAMプロジェクトのビルドとLambda関数の起動

```bash
# SAMプロジェクトのビルド
sam build

# Lambda関数のローカル実行環境を起動
sam local start-lambda
```

#### 3. Step Functions環境のセットアップ

```bash
# 別のターミナルで実行
DOCKER_HOST_IP=host.docker.internal node tests/setup-local-stepfunctions.js
```

#### 4. テストの実行

```bash
# 別のターミナルで実行
newman run tests/postman/serverless-test-collection.json -e tests/postman/environment.json
```

## 仕組みの解説

### Step Functions LocalとLambda関数の連携

Step Functions Localコンテナは、環境変数を通じてLambda関数のエンドポイントを認識します：

- `LAMBDA_ENDPOINT`: Lambda関数のエンドポイントURL
- `LAMBDA_FORWARD_REQUEST=1`: Lambda関数へのリクエスト転送を有効化
- `--add-host=host.docker.internal:host-gateway`: Dockerコンテナからホストマシンへのアクセスを可能にする

### ステートマシンの定義

`setup-local-stepfunctions.js` スクリプトは、ステートマシンの定義を読み込み、Lambda関数のARNをローカル環境用に置き換えます：

```javascript
const localDefinition = stateMachineDefinition
  .replace('${ProcessDataFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:ProcessDataFunction')
  .replace('${ValidateDataFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:ValidateDataFunction')
  .replace('${StoreResultFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:StoreResultFunction');
```

### テストAPIサーバー

`setup-local-stepfunctions.js` スクリプトは、Postmanテストからのリクエストを処理するためのAPIサーバーも起動します。このサーバーは、Step Functions Localへのリクエストを仲介し、実行結果を返します。

## トラブルシューティング

### ポートの競合

Step Functions LocalとテストAPIサーバーは同じポート（8083）を使用します。テストAPIサーバーは、ポートが既に使用されている場合、プロキシモードで動作します。

### Lambda関数へのアクセス

Step Functions LocalからLambda関数にアクセスできない場合は、以下を確認してください：

1. `DOCKER_HOST_IP` 環境変数が正しく設定されているか
2. Docker実行時に `--add-host=host.docker.internal:host-gateway` オプションが指定されているか
3. Lambda関数が正しいポート（3001）で実行されているか

### 実行タイムアウト

Step Functionsの実行が完了するまでに時間がかかる場合は、`setup-local-stepfunctions.js` のポーリング間隔とタイムアウト設定を調整してください：

```javascript
const maxRetries = 30; // 最大30秒待機に延長
```

## GitHub Actionsでの使用

GitHub Actionsでは、ワークフロー内でStep Functions Localコンテナを起動し、テストを実行します。`.github/workflows/test.yml` ファイルで設定されています。
