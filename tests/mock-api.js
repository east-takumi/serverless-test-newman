/**
 * Step Functions実行APIのモックサーバー
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// モックレスポンスの読み込み
let mockResponse;
try {
  mockResponse = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'mock-execution-response.json'),
    'utf8'
  ));
} catch (error) {
  // モックレスポンスがない場合はデフォルト値を使用
  mockResponse = {
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
}

// サーバーの作成
const server = http.createServer((req, res) => {
  console.log(`リクエスト: ${req.method} ${req.url}`);
  
  // POSTリクエストのボディを読み取る
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // Step Functions実行APIのモック
    if (req.method === 'POST' && req.url === '/execution') {
      console.log('Step Functions実行リクエスト:', body);
      
      // レスポンスヘッダー
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      // モックレスポンスを返す
      res.end(JSON.stringify(mockResponse));
    } else {
      // その他のエンドポイントには404を返す
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });
});

// サーバーの起動
const PORT = 8083;
server.listen(PORT, () => {
  console.log(`モックAPIサーバーが起動しました: http://localhost:${PORT}`);
});
