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
  region: 'local',
  accessKeyId: 'dummy',     // ダミーの認証情報
  secretAccessKey: 'dummy'  // ダミーの認証情報
});

// ローカルLambda設定
const lambda = new AWS.Lambda({
  endpoint: 'http://localhost:3001',
  region: 'local',
  accessKeyId: 'dummy',     // ダミーの認証情報
  secretAccessKey: 'dummy'  // ダミーの認証情報
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

    // 新しいステートマシンを作成
    const params = {
      name: 'DataProcessingStateMachine',
      definition: localDefinition,
      roleArn: 'arn:aws:iam::0123456789:role/DummyRole'
    };

    const result = await stepfunctions.createStateMachine(params).promise();
    console.log('ステートマシンを作成しました:', result.stateMachineArn);
    return result.stateMachineArn;
  } catch (error) {
    console.error('ステートマシン作成エラー:', error);
    throw error;
  }
}

// テスト用のAPIハンドラー
async function setupTestApi() {
  const http = require('http');
  const url = require('url');
  
  // テスト用のHTTPサーバーを作成
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // POSTリクエストのボディを読み取る
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Step Functions実行APIのエンドポイント
        if (req.method === 'POST' && parsedUrl.pathname === '/execution') {
          console.log('Step Functions実行リクエスト:', body);
          const requestData = JSON.parse(body);
          
          // Step Functionsの実行を開始
          const execParams = {
            stateMachineArn: requestData.stateMachineArn,
            input: requestData.input
          };
          
          try {
            const execResult = await stepfunctions.startExecution(execParams).promise();
            console.log('実行を開始しました:', execResult.executionArn);
            
            // 実行が完了するまで待機
            let executionStatus;
            let output;
            let retries = 0;
            const maxRetries = 10;
            
            do {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
              
              const execDetails = await stepfunctions.describeExecution({
                executionArn: execResult.executionArn
              }).promise();
              
              executionStatus = execDetails.status;
              output = execDetails.output;
              retries++;
              
              console.log(`実行ステータス: ${executionStatus} (試行: ${retries}/${maxRetries})`);
            } while (executionStatus === 'RUNNING' && retries < maxRetries);
            
            if (executionStatus === 'SUCCEEDED') {
              // 成功レスポンスを返す
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'SUCCEEDED',
                executionArn: execResult.executionArn,
                output: output
              }));
            } else {
              // 失敗または実行中のレスポンスを返す
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: executionStatus,
                executionArn: execResult.executionArn,
                error: 'Execution did not complete in time or failed'
              }));
            }
          } catch (execError) {
            console.error('実行エラー:', execError);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: execError.message }));
          }
        } else {
          // その他のエンドポイントには404を返す
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found' }));
        }
      } catch (error) {
        console.error('リクエスト処理エラー:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });
  
  // サーバーの起動
  const PORT = 8083;
  server.listen(PORT, () => {
    console.log(`テストAPIサーバーが起動しました: http://localhost:${PORT}`);
  });
}

// メイン処理
async function main() {
  try {
    console.log('ローカルStep Functions環境をセットアップしています...');
    const stateMachineArn = await createStateMachine();
    console.log('テストAPIサーバーをセットアップしています...');
    await setupTestApi();
    console.log('セットアップ完了');
    console.log('ステートマシンARN:', stateMachineArn);
  } catch (error) {
    console.error('セットアップエラー:', error);
    process.exit(1);
  }
}

main();
