/**
 * ローカルでのStep Functions実行環境をセットアップするスクリプト
 * 
 * このスクリプトは、AWS Step Functions Local を使用して
 * ローカル環境でのテスト実行をサポートします。
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

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

    // 新しいステートマシンを作成（roleArnを省略）
    const params = {
      name: 'DataProcessingStateMachine',
      definition: localDefinition
      // roleArnを省略
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
async function setupTestApi(stateMachineArn) {
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
            stateMachineArn: stateMachineArn,
            input: requestData.input
          };
          
          try {
            const execResult = await stepfunctions.startExecution(execParams).promise();
            console.log('実行を開始しました:', execResult.executionArn);
            
            // 実行が完了するまで待機
            let executionStatus;
            let output;
            let retries = 0;
            const maxRetries = 30; // 最大30秒待機
            
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
            
            // 実行結果を返す
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: executionStatus,
              executionArn: execResult.executionArn,
              output: output
            }));
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
  
  // 既存のプロセスが使用している場合は、別のポートを試す
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`ポート ${PORT} は既に使用されています。Step Functions Localが既に起動している可能性があります。`);
      console.log('プロキシモードで動作します...');
      
      // プロキシサーバーとして動作
      const proxyServer = http.createServer((req, res) => {
        const options = {
          hostname: 'localhost',
          port: PORT,
          path: req.url,
          method: req.method,
          headers: req.headers
        };
        
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        
        req.pipe(proxyReq, { end: true });
      });
      
      proxyServer.listen(8084, () => {
        console.log(`プロキシサーバーが起動しました: http://localhost:8084`);
      });
    } else {
      console.error('サーバー起動エラー:', e);
    }
  });
  
  server.listen(PORT, () => {
    console.log(`テストAPIサーバーが起動しました: http://localhost:${PORT}`);
  });
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
      
      // テストAPIサーバーをセットアップ
      await setupTestApi(stateMachineArn);
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
