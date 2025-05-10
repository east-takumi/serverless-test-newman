/**
 * UTC時刻をJST(日本標準時)に変換するLambda関数
 * 
 * 入力: UTCの現在時刻
 * 出力: JSTに変換された時刻
 */
exports.handler = async (event) => {
  console.log('Input event:', JSON.stringify(event, null, 2));
  
  // 入力が指定されていない場合は現在時刻を使用
  const utcTime = event.time ? new Date(event.time) : new Date();
  
  // UTCからJSTへの変換 (UTC+9時間)
  const jstTime = new Date(utcTime.getTime() + (9 * 60 * 60 * 1000));
  
  const result = {
    utcTime: utcTime.toISOString(),
    jstTime: jstTime.toISOString(),
    message: 'UTC時刻をJSTに変換しました'
  };
  
  console.log('Output:', JSON.stringify(result, null, 2));
  return result;
};
