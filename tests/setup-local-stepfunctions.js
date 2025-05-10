/**
 * ローカルテスト環境のセットアップスクリプト
 * 
 * このスクリプトは、AWS SAM LocalとStep Functions Localを使用して
 * ローカル環境でテストを実行するための準備を行います。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 結果ディレクトリの作成
const resultsDir = path.join(__dirname, '..', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('ローカルテスト環境をセットアップしています（Docker なし）...');

try {
  console.log('SAM ビルドと Docker 依存部分をスキップします');
  console.log('モックテスト環境を準備します...');
  
  // ここでモックテスト環境のセットアップコードを追加
  // 例: テスト用のモックデータを作成
  const mockDataDir = path.join(__dirname, 'mock-data');
  if (!fs.existsSync(mockDataDir)) {
    fs.mkdirSync(mockDataDir, { recursive: true });
  }
  
  // Lambda関数の出力をモックするJSONファイルを作成
  const convertToJSTOutput = {
    utcTime: "2025-05-10T00:00:00Z",
    jstTime: "2025-05-10T09:00:00Z",
    message: "UTC時刻をJSTに変換しました"
  };
  
  const calculateTimeDifferenceOutput = {
    utcTime: "2025-05-10T00:00:00Z",
    jstTime: "2025-05-10T09:00:00Z",
    targetDate: "2025-09-06T11:00:00Z",
    timeDifference: {
      totalMilliseconds: 10368000000,
      days: 120,
      hours: 2,
      minutes: 0,
      seconds: 0
    },
    message: "目標日時までの差分を計算しました"
  };
  
  const formatResultsOutput = {
    currentDate: {
      iso: "2025-05-10T09:00:00Z",
      formatted: "2025年05月10日"
    },
    daysUntilTarget: 120,
    targetDate: "2025-09-06T11:00:00Z",
    message: "結果を整形しました"
  };
  
  const stepFunctionsOutput = {
    executionArn: "arn:aws:states:local:0123456789:execution:DataProcessingStateMachine:test-execution",
    stateMachineArn: "arn:aws:states:local:0123456789:stateMachine:DataProcessingStateMachine",
    name: "test-execution",
    status: "SUCCEEDED",
    startDate: "2025-05-10T00:00:00.000Z",
    stopDate: "2025-05-10T00:00:10.000Z",
    input: "{\"time\": \"2025-05-10T00:00:00Z\"}",
    output: JSON.stringify(formatResultsOutput)
  };
  
  fs.writeFileSync(path.join(mockDataDir, 'convertToJST.json'), JSON.stringify(convertToJSTOutput, null, 2));
  fs.writeFileSync(path.join(mockDataDir, 'calculateTimeDifference.json'), JSON.stringify(calculateTimeDifferenceOutput, null, 2));
  fs.writeFileSync(path.join(mockDataDir, 'formatResults.json'), JSON.stringify(formatResultsOutput, null, 2));
  fs.writeFileSync(path.join(mockDataDir, 'stepFunctions.json'), JSON.stringify(stepFunctionsOutput, null, 2));
  
  console.log('モックデータを作成しました:', mockDataDir);
  console.log('セットアップが完了しました。テストを実行できます。');
  console.log('テストを実行するには: npm run test');
  
} catch (error) {
  console.error('セットアップ中にエラーが発生しました:', error);
  process.exit(1);
}
