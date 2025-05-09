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
# SAMプロジェクトの初期化
sam build

# ローカルでのテスト実行
npm run test
```

## テスト自動化の仕組み

1. AWS SAMでローカルLambda実行環境を構築
2. Step Functionsのモック実行
3. Newmanを使って各ステートの入出力を検証
