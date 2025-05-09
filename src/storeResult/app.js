/**
 * 結果保存Lambda関数
 * 検証済みデータを保存します
 */
exports.handler = async (event) => {
  console.log('StoreResult function invoked with event:', JSON.stringify(event));
  
  // 入力データの検証
  if (!event.validationResult) {
    throw new Error('Invalid input: missing validation result');
  }
  
  // 結果保存ロジック（実際のプロジェクトではDynamoDBなどに保存）
  const finalResult = {
    ...event,
    storage: {
      storedAt: new Date().toISOString(),
      storageId: `result-${Date.now()}`,
      storageStatus: 'COMPLETED'
    }
  };
  
  console.log('Final result:', JSON.stringify(finalResult));
  
  // ワークフローの最終結果を返す
  return finalResult;
};
