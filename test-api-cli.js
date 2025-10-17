import { testAllConnections } from './src/services/ai/index.ts';

console.log('AI API接続テストを開始します...\n');

try {
  const results = await testAllConnections();
  
  console.log('テスト結果:');
  console.log('=====================================');
  
  for (const [provider, success] of Object.entries(results)) {
    const status = success ? '✅ 成功' : '❌ 失敗';
    console.log(`${provider}: ${status}`);
  }
  
  console.log('=====================================');
  
  const successCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n結果: ${successCount}/${totalCount} のAPIが正常に接続できました。`);
  
} catch (error) {
  console.error('テスト実行中にエラーが発生しました:', error);
}