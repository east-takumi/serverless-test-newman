/**
 * 現在時刻から2025年9月6日20:00:00(JST)までの差を計算するLambda関数
 * 
 * 入力: 前のステップからのJST時刻
 * 出力: 目標日時までの差分
 */
exports.handler = async (event) => {
  console.log('Input event:', JSON.stringify(event, null, 2));
  
  // 前のステップからJST時刻を取得
  const currentJstTime = new Date(event.jstTime);
  
  // 目標日時: 2025年9月6日20:00:00(JST)
  const targetDate = new Date('2025-09-06T20:00:00+09:00');
  
  // 差分を計算（ミリ秒）
  const differenceMs = targetDate.getTime() - currentJstTime.getTime();
  
  // ミリ秒を日、時間、分、秒に変換
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  
  const days = Math.floor(differenceMs / msPerDay);
  const hours = Math.floor((differenceMs % msPerDay) / msPerHour);
  const minutes = Math.floor((differenceMs % msPerHour) / msPerMinute);
  const seconds = Math.floor((differenceMs % msPerMinute) / msPerSecond);
  
  const result = {
    ...event,
    targetDate: targetDate.toISOString(),
    timeDifference: {
      totalMilliseconds: differenceMs,
      days,
      hours,
      minutes,
      seconds
    },
    message: '目標日時までの差分を計算しました'
  };
  
  console.log('Output:', JSON.stringify(result, null, 2));
  return result;
};
