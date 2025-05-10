/**
 * 結果を整形するLambda関数
 * 
 * 入力: 前のステップからの時刻データと差分データ
 * 出力: 
 *   - 現在時刻をYYYY年MM月DD日の形式に変換
 *   - 目標日時までの日数（時間は切り捨て）
 */
exports.handler = async (event) => {
  console.log('Input event:', JSON.stringify(event, null, 2));
  
  // JSTの現在時刻を取得
  const jstTime = new Date(event.jstTime);
  
  // YYYY年MM月DD日の形式に変換
  const year = jstTime.getFullYear();
  const month = jstTime.getMonth() + 1; // getMonth()は0から始まるため+1
  const day = jstTime.getDate();
  
  const formattedDate = `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`;
  
  // 目標日時までの日数（時間は切り捨て）
  const daysUntilTarget = event.timeDifference.days;
  
  const result = {
    currentDate: {
      iso: event.jstTime,
      formatted: formattedDate
    },
    daysUntilTarget,
    targetDate: event.targetDate,
    message: '結果を整形しました'
  };
  
  console.log('Output:', JSON.stringify(result, null, 2));
  return result;
};
