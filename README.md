# サーバレステスト自動化プロジェクト

このプロジェクトは、AWS Lambda関数とStep Functionsを使ったサーバレスアプリケーションのテストを自動化するためのものです。

## 構成

- AWS SAMを使用してLambda関数とStep Functionsを定義
- Postman/Newmanを使用してテストケースを管理・実行
- GitHub Actionsでテストを自動実行

## 前提条件

- AWS SAM CLI
- Node.js
- Newman (Postman CLI)

## セットアップ

```bash
# 依存関係のインストール
npm install --legacy-peer-deps

# SAMプロジェクトのビルド
sam build

# ローカルでのテスト実行
npm run test
```

## テスト自動化の仕組み

1. AWS SAMでローカルLambda実行環境を構築
2. Step Functionsのモック実行
3. Newmanを使って各ステートの入出力を検証

## プロジェクト構成

```
serverless-test-newman/
├── .github/workflows/    # GitHub Actions設定
├── src/                  # Lambda関数のソースコード
├── statemachine/         # Step Functions定義
├── tests/                # テストコードとPostmanコレクション
├── results/              # テスト結果出力ディレクトリ
├── template.yaml         # AWS SAMテンプレート
└── package.json          # プロジェクト設定
```

## Postman同期機能の有効化

このプロジェクトには、ローカルのPostmanコレクションとPostmanアカウント間で同期するための機能が含まれています（現在は無効化されています）。この機能を有効化するには、以下の手順に従ってください：

### 1. 必要なパッケージのインストール

```bash
npm install axios --save-dev
```

### 2. Postman APIキーの取得

1. Postmanアカウントにログイン
2. 右上のユーザーアイコンをクリック → 「Settings」を選択
3. 「API Keys」タブを選択
4. 「Create API Key」ボタンをクリック
5. キーの名前を入力し、「Generate API Key」をクリック
6. 生成されたAPIキーをコピー（このキーは一度しか表示されないので注意）

### 3. postman-sync.jsファイルの編集

`postman-sync.js`ファイルを開き、以下の行のコメントを解除します：

```javascript
// const axios = require('axios');
↓
const axios = require('axios');
```

```javascript
// const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY;
↓
const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY;
```

また、メイン処理部分のコメントも解除します（`/*` と `*/` を削除）：

```javascript
/*
// Postman APIクライアント
...
async function main() {
  ...
}
*/
↓
// Postman APIクライアント
...
async function main() {
  ...
}
```

最後に、ファイル末尾の以下の行をコメントアウトまたは削除します：

```javascript
console.log('Postman同期機能は現在無効になっています。');
console.log('README.mdの「Postman同期機能の有効化」セクションを参照して有効化してください。');
```

そして、以下の行を追加します：

```javascript
main();
```

### 4. package.jsonの編集

`package.json`ファイルの`scripts`セクションを編集します：

```json
"postman:upload": "echo \"Postman同期機能は現在無効です。README.mdを参照して有効化してください。\"",
"postman:download": "echo \"Postman同期機能は現在無効です。README.mdを参照して有効化してください。\"",
↓
"postman:upload": "node postman-sync.js upload",
"postman:download": "node postman-sync.js download",
```

### 5. 環境変数の設定

ローカルでの実行時は、以下のように環境変数を設定します：

```bash
# macOS/Linux
export POSTMAN_API_KEY=your_api_key_here

# Windows
set POSTMAN_API_KEY=your_api_key_here
```

初回アップロード後、コレクションIDと環境IDが表示されるので、それらも環境変数として設定します：

```bash
# macOS/Linux
export POSTMAN_COLLECTION_ID=your_collection_id
export POSTMAN_ENVIRONMENT_ID=your_environment_id

# Windows
set POSTMAN_COLLECTION_ID=your_collection_id
set POSTMAN_ENVIRONMENT_ID=your_environment_id
```

### 6. GitHub Actionsでの使用（オプション）

GitHub Actionsで自動同期を有効にするには、`.github/workflows/test.yml`ファイルのコメントを解除します：

```yaml
# - name: Sync with Postman
#   if: github.event_name == 'push' && github.ref == 'refs/heads/main'
#   run: npm run postman:upload
#   env:
#     POSTMAN_API_KEY: ${{ secrets.POSTMAN_API_KEY }}
#     POSTMAN_COLLECTION_ID: ${{ secrets.POSTMAN_COLLECTION_ID }}
#     POSTMAN_ENVIRONMENT_ID: ${{ secrets.POSTMAN_ENVIRONMENT_ID }}
↓
- name: Sync with Postman
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npm run postman:upload
  env:
    POSTMAN_API_KEY: ${{ secrets.POSTMAN_API_KEY }}
    POSTMAN_COLLECTION_ID: ${{ secrets.POSTMAN_COLLECTION_ID }}
    POSTMAN_ENVIRONMENT_ID: ${{ secrets.POSTMAN_ENVIRONMENT_ID }}
```

また、GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」で以下のシークレットを設定します：

- `POSTMAN_API_KEY`: Postman APIキー
- `POSTMAN_COLLECTION_ID`: コレクションID（初回アップロード後に取得）
- `POSTMAN_ENVIRONMENT_ID`: 環境ID（初回アップロード後に取得）

### 7. 使用方法

設定が完了したら、以下のコマンドで同期を実行できます：

```bash
# ローカルのコレクションをPostmanにアップロード
npm run postman:upload

# Postmanのコレクションをローカルにダウンロード
npm run postman:download
```

これにより、ローカルのJSONファイルとPostmanアカウント間でテストコレクションを簡単に同期できるようになります。
