/**
 * データ検証Lambda関数
 * 処理されたデータを検証します
 */
exports.handler = async (event) => {
  console.log('ValidateData function invoked with event:', JSON.stringify(event));
  
  // 入力データの検証
  if (!event.originalData || !event.status) {
    throw new Error('Invalid input: missing required fields');
  }
  
  // データ検証ロジック
  const isValid = event.status === 'PROCESSED';
  
  const validationResult = {
    ...event,
    validationResult: {
      isValid,
      validatedAt: new Date().toISOString(),
      validationRules: ['format_check', 'content_validation'],
      validationStatus: isValid ? 'PASSED' : 'FAILED'
    }
  };
  
  console.log('Validation result:', JSON.stringify(validationResult));
  
  // 次のステートに渡すデータを返す
  return validationResult;
};
