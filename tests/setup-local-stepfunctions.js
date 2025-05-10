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

console.log('ローカルテスト環境をセットアップしています...');

try {
  // SAMビルドの実行
  console.log('SAMプロジェクトをビルドしています...');
  execSync('sam build', { stdio: 'inherit' });
  
  // Step Functions Localの起動確認
  console.log('Step Functions Localの状態を確認しています...');
  try {
    execSync('docker ps | grep amazon/aws-stepfunctions-local', { stdio: 'pipe' });
    console.log('Step Functions Localは既に実行中です');
  } catch (error) {
    console.log('Step Functions Localを起動しています...');
    execSync('docker run -d -p 8083:8083 --name stepfunctions-local amazon/aws-stepfunctions-local', { stdio: 'inherit' });
  }
  
  // Lambda関数のローカル起動
  console.log('Lambda関数をローカルで起動しています...');
  const samLocalProcess = execSync('sam local start-lambda --port 3001 &', { stdio: 'inherit' });
  
  console.log('セットアップが完了しました。テストを実行できます。');
  console.log('テストを実行するには: npm run test');
  
} catch (error) {
  console.error('セットアップ中にエラーが発生しました:', error);
  process.exit(1);
}
