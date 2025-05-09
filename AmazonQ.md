# サーバレステスト自動化プロジェクトの設計と実装

## プロジェクト概要

このプロジェクトは、AWS Lambda関数とStep Functionsを使ったサーバレスアプリケーションのテストを自動化するためのものです。主な目的は、手動で行っていたテストプロセスを自動化し、各ステートでの入出力が期待値と一致しているかを自動的に検証することです。

## 技術スタック

- **AWS SAM**: Lambda関数とStep Functionsのリソース定義
- **Node.js**: Lambda関数の実装言語
- **Postman/Newman**: テストケースの管理と実行
- **GitHub Actions**: CI/CDパイプラインでの自動テスト実行

## プロジェクト構成

```
serverless-test-newman/
├── .github/
│   └── workflows/
│       └── test.yml         # GitHub Actionsワークフロー定義
├── src/
│   ├── processData/         # 第1ステートのLambda関数
│   ├── validateData/        # 第2ステートのLambda関数
│   └── storeResult/         # 第3ステートのLambda関数
├── statemachine/
│   └── data_processing.asl.json  # Step Functions定義
├── tests/
│   ├── postman/
│   │   ├── serverless-test-collection.json  # Postmanコレクション
│   │   └── environment.json                 # テスト環境設定
│   └── setup-local-stepfunctions.js         # ローカルテスト環境セットアップ
├── results/                 # テスト結果出力ディレクトリ
├── template.yaml            # AWS SAMテンプレート
├── package.json             # プロジェクト設定
└── README.md                # プロジェクト説明
```

## 実装の特徴

### 1. Step Functions ワークフロー

3つのステートで構成されるシンプルなワークフロー:
- **ProcessData**: 入力データを処理
- **ValidateData**: 処理されたデータを検証
- **StoreResult**: 検証済みデータを保存

### 2. テスト自動化の仕組み

1. **個別Lambda関数のテスト**:
   - 各Lambda関数を個別に呼び出し、入出力を検証
   - 前のステップの出力を次のステップの入力として使用

2. **ワークフロー全体のテスト**:
   - Step Functionsのエンドツーエンド実行をテスト
   - 最終出力が期待通りかを検証

### 3. Postman/Newmanによるテスト管理

- Postmanコレクションでテストケースを定義
- テスト条件と期待値をコード化
- Newmanを使ってCLIからテストを実行

### 4. GitHub Actionsでの自動実行

- PRがプッシュされるたびにテストを自動実行
- AWS環境へのデプロイなしでテスト完結
- テスト結果をアーティファクトとして保存

## 使い方

### ローカルでのテスト実行

```bash
# 依存関係のインストール
npm install --legacy-peer-deps

# SAMプロジェクトのビルド
npm run build

# テストの実行
npm run test
```

### GitHub Actionsでの自動テスト

リポジトリにプッシュするだけで、GitHub Actionsが自動的にテストを実行します。テスト結果はワークフローの実行結果ページで確認できます。

## 拡張性

このプロジェクトは以下のように拡張可能です:

1. **テストケースの追加**: Postmanコレクションに新しいテストケースを追加
2. **ステートの追加**: 新しいLambda関数とステートを追加し、対応するテストを実装
3. **レポート形式の拡張**: HTML、JUnit以外のレポート形式を追加
