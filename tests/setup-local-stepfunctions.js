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
