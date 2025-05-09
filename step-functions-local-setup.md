# AWS Step Functions Local のセットアップと使用方法

このプロジェクトでは、AWS Step Functions Localを使用して、実際のAWS環境にデプロイすることなくStep Functionsのワークフローをテストします。

## 前提条件

- Docker（Step Functions Localコンテナを実行するため）
- Node.js
- AWS SAM CLI

## ローカル環境でのセットアップ

### 1. Step Functions Localコンテナの起動

```bash
docker run -d -p 8083:8083 --name stepfunctions-local amazon/aws-stepfunctions-local
```

### 2. テスト環境の起動

```bash
# SAMプロジェクトのビルド
npm run build

# ローカルLambdaとStep Functions環境の起動
npm run start-local

# テストの実行
newman run tests/postman/serverless-test-collection.json -e tests/postman/environment.json
```

## 仕組みの解説

1. **Step Functions Localコンテナ**:
   - ポート8083でStep Functions APIをエミュレート
   - ステートマシンの作成と実行をローカルで処理

2. **setup-local-stepfunctions.js**:
   - ステートマシンの定義をローカル環境用に調整
   - Step Functions LocalにステートマシンをデプロイするためのAPIクライアント
   - テストAPIサーバーを提供して、Step Functions実行をハンドリング

3. **Lambda関数とStep Functionsの連携**:
   - SAM Localが提供するLambda関数のエンドポイントをStep Functions Localから呼び出し
   - 実際のAWS環境と同様のワークフローを実現

## トラブルシューティング

### 認証エラー

Step Functions LocalへのAPIリクエストで認証エラーが発生する場合は、AWS SDKの設定でダミーの認証情報を使用していることを確認してください：

```javascript
const stepfunctions = new AWS.StepFunctions({
  endpoint: 'http://localhost:8083',
  region: 'local',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});
```

### ネットワーク接続の問題

Dockerコンテナ内のStep Functions LocalからSAM LocalのLambda関数にアクセスできない場合：

1. Dockerネットワークの設定を確認
2. ホストマシンのIPアドレスを使用してLambda関数にアクセス
3. Docker内のネットワーク設定を調整

### 実行タイムアウト

Step Functionsの実行が完了するまでに時間がかかる場合は、`setup-local-stepfunctions.js`のポーリング間隔とタイムアウト設定を調整してください。

## GitHub Actionsでの使用

GitHub Actionsでは、ワークフロー内でStep Functions Localコンテナを起動し、テストを実行します。`.github/workflows/test.yml`ファイルで設定されています。

## 注意事項

- Step Functions Localは実際のAWS Step Functionsと完全に同じ動作を保証するものではありません
- 複雑なステートマシンや特定のサービス統合では、動作が異なる場合があります
- 本番環境へのデプロイ前に、実際のAWS環境でもテストすることをお勧めします
