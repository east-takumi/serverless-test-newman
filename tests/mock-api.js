/**
 * モックAPIサーバー
 * 
 * このスクリプトは、Lambda関数とStep Functionsのモックエンドポイントを提供します。
 * Docker環境がない場合や、ローカルでのテスト実行を簡素化するために使用します。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// モックデータのディレクトリ
const mockDataDir = path.join(__dirname, 'mock-data');

// Lambda関数のモックレスポンス
const lambdaResponses = {
  'ConvertToJSTFunction': path.join(mockDataDir, 'convertToJST.json'),
  'CalculateTimeDifferenceFunction': path.join(mockDataDir, 'calculateTimeDifference.json'),
  'FormatResultsFunction': path.join(mockDataDir, 'formatResults.json')
};

// Step Functionsのモックレスポンス
const stepFunctionsResponse = path.join(mockDataDir, 'stepFunctions.json');

// Lambda関数のモックサーバー（ポート3001）
const lambdaServer = http.createServer((req, res) => {
  console.log(`Lambda Mock: ${req.method} ${req.url}`);
  
  // リクエストボディを読み込む
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // URLからLambda関数名を抽出
    const parsedUrl = url.parse(req.url);
    const pathParts = parsedUrl.pathname.split('/');
    const functionName = pathParts[pathParts.length - 2];
    
    console.log(`Function name: ${functionName}`);
    console.log(`Request body: ${body}`);
    
    // 対応するモックレスポンスを返す
    if (lambdaResponses[functionName]) {
      try {
        const responseData = fs.readFileSync(lambdaResponses[functionName], 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(responseData);
        console.log(`Responded with mock data for ${functionName}`);
      } catch (error) {
        console.error(`Error reading mock data for ${functionName}:`, error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    } else {
      console.error(`No mock data found for function: ${functionName}`);
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Function Not Found' }));
    }
  });
});

// Step Functionsのモックサーバー（ポート8083）
const stepFunctionsServer = http.createServer((req, res) => {
  console.log(`Step Functions Mock: ${req.method} ${req.url}`);
  
  // リクエストボディを読み込む
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // Step Functions実行のモックレスポンスを返す
    try {
      const responseData = fs.readFileSync(stepFunctionsResponse, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(responseData);
      console.log('Responded with Step Functions mock data');
    } catch (error) {
      console.error('Error reading Step Functions mock data:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });
});

// サーバーを起動
lambdaServer.listen(3001, () => {
  console.log('Lambda Mock Server running on port 3001');
});

stepFunctionsServer.listen(8083, () => {
  console.log('Step Functions Mock Server running on port 8083');
});

// プロセス終了時にサーバーを停止
process.on('SIGINT', () => {
  console.log('Shutting down mock servers...');
  lambdaServer.close();
  stepFunctionsServer.close();
  process.exit(0);
});
