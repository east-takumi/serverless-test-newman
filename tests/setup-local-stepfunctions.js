/**
 * ローカルでのStep Functions実行環境をセットアップするスクリプト
 * 
 * このスクリプトは、AWS Step Functions Local を使用して
 * ローカル環境でのテスト実行をサポートします。
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// ホストマシンのIPアドレス（Docker環境用）
const DOCKER_HOST_IP = process.env.DOCKER_HOST_IP || 'host.docker.internal';

// ローカルStep Functions設定
const stepfunctions = new AWS.StepFunctions({
  endpoint: 'http://localhost:8083',
  region: 'us-east-1',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});

// ステートマシン定義の読み込み
const stateMachineDefinition = fs.readFileSync(
  path.join(__dirname, '../statemachine/data_processing.asl.json'),
  'utf8'
);

// Lambda ARNをローカル環境用に置換
const localDefinition = stateMachineDefinition
  .replace('${ProcessDataFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:ProcessDataFunction')
  .replace('${ValidateDataFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:ValidateDataFunction')
  .replace('${StoreResultFunctionArn}', 'arn:aws:lambda:us-east-1:123456789012:function:StoreResultFunction');

// ステートマシンの作成
async function createStateMachine() {
  try {
    // 既存のステートマシンを削除（存在する場合）
    try {
      const listResult = await stepfunctions.listStateMachines({}).promise();
      for (const machine of listResult.stateMachines) {
        if (machine.name === 'DataProcessingStateMachine') {
          console.log(`既存のステートマシンを削除します: ${machine.stateMachineArn}`);
          await stepfunctions.deleteStateMachine({ stateMachineArn: machine.stateMachineArn }).promise();
          // 削除後少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (listError) {
      console.log('ステートマシンのリスト取得中にエラーが発生しました（新規作成を続行します）:', listError.message);
    }

    // 様々なロールARN形式を試す
    const roleArns = [
      'arn:aws:iam::123456789012:role/service-role/StepFunctionsLocal',
      'arn:aws:iam::123456789012:role/StepFunctionsLocal',
      'arn:aws:iam::012345678901:role/DummyRole',
      'arn:aws:iam::0123456789:role/DummyRole'
    ];

    let stateMachineArn = null;
    let success = false;

    // 各ロールARNを順番に試す
    for (const roleArn of roleArns) {
      try {
        console.log(`ロールARN "${roleArn}" でステートマシンの作成を試みます...`);
        const params = {
          name: 'DataProcessingStateMachine',
          definition: localDefinition,
          roleArn: roleArn
        };

        const result = await stepfunctions.createStateMachine(params).promise();
        console.log('ステートマシンを作成しました:', result.stateMachineArn);
        stateMachineArn = result.stateMachineArn;
        success = true;
        break;
      } catch (error) {
        console.log(`ロールARN "${roleArn}" でのステートマシン作成に失敗しました:`, error.message);
      }
    }

    // すべてのロールARNが失敗した場合、roleArnなしで試す
    if (!success) {
      try {
        console.log('roleArnなしでステートマシンの作成を試みます...');
        const params = {
          name: 'DataProcessingStateMachine',
          definition: localDefinition
        };

        const result = await stepfunctions.createStateMachine(params).promise();
        console.log('ステートマシンを作成しました:', result.stateMachineArn);
        stateMachineArn = result.stateMachineArn;
        success = true;
      } catch (error) {
        console.log('roleArnなしでのステートマシン作成に失敗しました:', error.message);
      }
    }

    // それでも失敗した場合はエラーをスロー
    if (!success) {
      throw new Error('すべての方法でステートマシン作成に失敗しました。');
    }

    return stateMachineArn;
  } catch (error) {
    console.error('ステートマシン作成プロセスでエラーが発生しました:', error);
    throw error;
  }
}

// テスト実行用のサンプル
async function runTestExecution(stateMachineArn) {
  try {
    const input = {
      data: 'sample-test-data-123',
      source: 'test-automation'
    };
    
    const params = {
      stateMachineArn: stateMachineArn,
      input: JSON.stringify(input)
    };
    
    const result = await stepfunctions.startExecution(params).promise();
    console.log('テスト実行を開始しました:', result.executionArn);
    
    // 実行が完了するまで待機
    let executionStatus;
    let output;
    let retries = 0;
    const maxRetries = 30; // 最大30秒待機
    
    do {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      const execDetails = await stepfunctions.describeExecution({
        executionArn: result.executionArn
      }).promise();
      
      executionStatus = execDetails.status;
      output = execDetails.output;
      retries++;
      
      console.log(`実行ステータス: ${executionStatus} (試行: ${retries}/${maxRetries})`);
    } while (executionStatus === 'RUNNING' && retries < maxRetries);
    
    console.log('テスト実行結果:', executionStatus);
    if (output) {
      console.log('出力:', output);
    }
    
    return executionStatus === 'SUCCEEDED';
  } catch (error) {
    console.error('テスト実行エラー:', error);
    return false;
  }
}

// メイン処理
async function main() {
  try {
    console.log('ローカルStep Functions環境をセットアップしています...');
    
    // Step Functions Localが起動しているか確認
    try {
      await stepfunctions.listStateMachines({}).promise();
      console.log('Step Functions Localに接続しました');
      
      // ステートマシンを作成
      const stateMachineArn = await createStateMachine();
      console.log('ステートマシンARN:', stateMachineArn);
      
      // テスト実行
      const testSuccess = await runTestExecution(stateMachineArn);
      if (testSuccess) {
        console.log('テスト実行が成功しました。Step Functions Localは正常に動作しています。');
      } else {
        console.log('テスト実行が失敗しました。Step Functions Localの設定を確認してください。');
      }
      
      console.log('セットアップ完了');
      console.log('ステートマシンARN:', stateMachineArn);
      console.log('このARNをPostman環境変数の"stateMachineArn"に設定してください。');
    } catch (error) {
      console.error('Step Functions Localへの接続エラー:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('セットアップエラー:', error);
    process.exit(1);
  }
}

main();
