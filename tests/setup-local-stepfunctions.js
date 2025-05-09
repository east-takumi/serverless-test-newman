/**
 * ローカルでのStep Functions実行環境をセットアップするスクリプト
 * 
 * このスクリプトは、AWS Step Functions Local を使用して
 * ローカル環境でのテスト実行をサポートします。
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// ローカルStep Functions設定
const stepfunctions = new AWS.StepFunctions({
  endpoint: 'http://localhost:8083',
  region: 'local'
});

// ステートマシン定義の読み込み
const stateMachineDefinition = fs.readFileSync(
  path.join(__dirname, '../statemachine/data_processing.asl.json'),
  'utf8'
);

// Lambda ARNをローカル環境用に置換
const localDefinition = stateMachineDefinition
  .replace('${ProcessDataFunctionArn}', 'arn:aws:lambda:local:0123456789:function:ProcessDataFunction')
  .replace('${ValidateDataFunctionArn}', 'arn:aws:lambda:local:0123456789:function:ValidateDataFunction')
  .replace('${StoreResultFunctionArn}', 'arn:aws:lambda:local:0123456789:function:StoreResultFunction');

// ステートマシンの作成
async function createStateMachine() {
  try {
    const params = {
      name: 'DataProcessingStateMachine',
      definition: localDefinition,
      roleArn: 'arn:aws:iam::0123456789:role/DummyRole'
    };

    const result = await stepfunctions.createStateMachine(params).promise();
    console.log('ステートマシンを作成しました:', result.stateMachineArn);
    
    // テスト用にサンプル実行を作成
    const execParams = {
      stateMachineArn: result.stateMachineArn,
      input: JSON.stringify({
        data: 'sample-test-data-123',
        source: 'test-automation'
      })
    };
    
    const execResult = await stepfunctions.startExecution(execParams).promise();
    console.log('ステートマシン実行を開始しました:', execResult.executionArn);
    
    // 実行結果を確認するためのエンドポイントをモック
    console.log('モックエンドポイントをセットアップしています...');
    
    // Express Step Functionsのモック応答を作成
    const mockResponse = {
      status: 'SUCCEEDED',
      output: JSON.stringify({
        originalData: 'sample-test-data-123',
        processedAt: new Date().toISOString(),
        status: 'PROCESSED',
        metadata: {
          source: 'test-automation',
          version: '1.0'
        },
        validationResult: {
          isValid: true,
          validatedAt: new Date().toISOString(),
          validationRules: ['format_check', 'content_validation'],
          validationStatus: 'PASSED'
        },
        storage: {
          storedAt: new Date().toISOString(),
          storageId: `result-${Date.now()}`,
          storageStatus: 'COMPLETED'
        }
      })
    };
    
    // モック応答をファイルに保存（実際のAPIサーバーを作成する代わり）
    fs.writeFileSync(
      path.join(__dirname, '../tests/mock-execution-response.json'),
      JSON.stringify(mockResponse, null, 2)
    );
    
    console.log('モック応答を作成しました');
  } catch (error) {
    console.error('ステートマシン作成エラー:', error);
  }
}

// メイン処理
async function main() {
  console.log('ローカルStep Functions環境をセットアップしています...');
  await createStateMachine();
  console.log('セットアップ完了');
}

main();
