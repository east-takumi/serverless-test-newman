/**
 * データ処理Lambda関数
 * 入力データを受け取り、処理を行います
 */
exports.handler = async (event) => {
  console.log('ProcessData function invoked with event:', JSON.stringify(event));
  
  // 入力データの検証
  if (!event.data) {
    throw new Error('Input data is required');
  }
  
  // データ処理ロジック
  const processedData = {
    originalData: event.data,
    processedAt: new Date().toISOString(),
    status: 'PROCESSED',
    metadata: {
      source: event.source || 'unknown',
      version: '1.0'
    }
  };
  
  console.log('Processed data:', JSON.stringify(processedData));
  
  // 次のステートに渡すデータを返す
  return processedData;
};
