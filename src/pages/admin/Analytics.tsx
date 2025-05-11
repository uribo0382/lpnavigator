import React, { useState, useEffect } from 'react';
import { BarChart2, Users, Zap, BookOpen, Clock, CalendarDays, PieChart, TrendingUp, Map } from 'lucide-react';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';

// 期間選択オプション
const timeRangeOptions = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'last7days', label: '過去7日間' },
  { value: 'last30days', label: '過去30日間' },
  { value: 'thisMonth', label: '今月' },
  { value: 'lastMonth', label: '先月' },
  { value: 'custom', label: 'カスタム期間' },
];

// 日付ユーティリティ関数
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getShortLabel = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch (e) {
    return '不正な日付';
  }
};

// モックデータの生成
const CURRENT_YEAR = new Date().getFullYear();
const MOCK_DATA_LATEST_DATE = new Date(CURRENT_YEAR, new Date().getMonth(), new Date().getDate());

// 基本的なデータ
const baseMockData = {
  // コンバージョン率データ
  conversionRates: {
    overall: 3.2,
    byIndustry: {
      'IT/テクノロジー': 4.5,
      '小売/Eコマース': 3.8,
      'サービス業': 2.9,
      '製造業': 2.2,
      '金融/保険': 3.1
    }
  },
  // ユーザーデモグラフィック
  userDemographics: {
    companySize: {
      '1-10人': 15,
      '11-50人': 25,
      '51-200人': 30,
      '201-500人': 20,
      '501人以上': 10
    },
    industry: {
      'IT/テクノロジー': 30,
      '小売/Eコマース': 25,
      'サービス業': 20,
      '製造業': 15,
      '金融/保険': 10
    }
  },
  // ユーザー行動データ
  userBehavior: {
    averageSessionDuration: 12, // 分
    averageQuestionsCompleted: 9,
    contentGenerationRate: 68, // パーセント
    returnRate: 42 // パーセント
  },
  // 地域分布
  regionalData: {
    '関東': 40,
    '関西': 25,
    '中部': 15,
    '九州': 10,
    '東北': 5,
    'その他': 5
  }
};

// 固定の過去7日間のデータ（日により明確な変動を持つ）
const fixedLast7DaysData = [
  { date: '2023-10-25', newUsers: 18, activeUsers: 42, completions: 34 }, // 水曜日 - 少なめ
  { date: '2023-10-26', newUsers: 23, activeUsers: 55, completions: 45 }, // 木曜日 - やや多め
  { date: '2023-10-27', newUsers: 28, activeUsers: 64, completions: 51 }, // 金曜日 - 多め
  { date: '2023-10-28', newUsers: 12, activeUsers: 29, completions: 22 }, // 土曜日 - 少なめ
  { date: '2023-10-29', newUsers: 10, activeUsers: 26, completions: 19 }, // 日曜日 - 少なめ
  { date: '2023-10-30', newUsers: 31, activeUsers: 69, completions: 55 }, // 月曜日 - 多め
  { date: '2023-10-31', newUsers: 20, activeUsers: 48, completions: 38 }  // 火曜日 - 標準
];

// 固定の過去30日間のデータを生成（多様な変動パターンを入れる）
const generateFixedMonthData = () => {
  const monthData = [...fixedLast7DaysData]; // 直近の7日間は固定データを使用
  
  // 残りの23日間を生成
  for (let i = 7; i < 30; i++) {
    const date = new Date(MOCK_DATA_LATEST_DATE);
    date.setDate(MOCK_DATA_LATEST_DATE.getDate() - i);
    const dateStr = formatDate(date);
    
    // 曜日によって基本値を変える
    const dayOfWeek = date.getDay();
    
    // 基本値の設定（曜日ごとに異なる）
    let baseNewUsers = 20; // デフォルト値
    
    if (dayOfWeek === 1) { // 月曜
      baseNewUsers = 25 + Math.floor(Math.random() * 8); // 25-32
    } else if (dayOfWeek === 5) { // 金曜
      baseNewUsers = 24 + Math.floor(Math.random() * 7); // 24-30
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 週末
      baseNewUsers = 9 + Math.floor(Math.random() * 5); // 9-13
    } else {
      baseNewUsers = 16 + Math.floor(Math.random() * 9); // 16-24
    }
    
    // イベント効果（特定の日にスパイク発生）
    if (i === 12 || i === 23) { // 特定の2日間に大幅増加
      baseNewUsers = Math.floor(baseNewUsers * (1.7 + Math.random() * 0.6)); // 1.7-2.3倍
    }
    
    // 新規ユーザー数の決定
    const newUsers = baseNewUsers;
    
    // アクティブユーザー数（新規ユーザーの1.8〜3倍、曜日によって変動）
    const activeMultiplier = dayOfWeek === 1 || dayOfWeek === 5 ? 
                            (2.3 + Math.random() * 0.7) :  // 月・金は高め
                            (1.8 + Math.random() * 0.9);   // その他の日
    
    const activeUsers = Math.floor(newUsers * activeMultiplier);
    
    // 完了数（アクティブユーザーの60-85%）
    const completionRate = 0.6 + Math.random() * 0.25;
    const completions = Math.floor(activeUsers * completionRate);
    
    monthData.push({
      date: dateStr,
      newUsers,
      activeUsers,
      completions
    });
  }
  
  // 日付の古い順にソート
  return monthData.sort((a, b) => a.date.localeCompare(b.date));
};

const fixedMonthData = generateFixedMonthData();

// 利用トレンドデータを取得する関数
const getTrendData = (rangeType: string, startDate?: string, endDate?: string): Array<{
  date: string;
  newUsers: number;
  activeUsers: number;
  completions: number;
  label?: string;
}> => {
  // 日付を取得
  const today = formatDate(MOCK_DATA_LATEST_DATE);
  
  let result: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
    completions: number;
    label?: string;
  }> = [];
  
  switch (rangeType) {
    case 'today':
      // 今日のデータ
      return [{ 
        date: today, 
        newUsers: 23, 
        activeUsers: 54, 
        completions: 43, 
        label: '今日' 
      }];
      
    case 'yesterday':
      // 昨日のデータ
      const yesterday = new Date(MOCK_DATA_LATEST_DATE);
      yesterday.setDate(MOCK_DATA_LATEST_DATE.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
      return [{ 
        date: yesterdayStr, 
        newUsers: 20, 
        activeUsers: 48, 
        completions: 38, 
        label: '昨日' 
      }];
      
    case 'last7days':
      // 過去7日間のデータ
      return fixedLast7DaysData.map(item => ({
        ...item,
        label: getShortLabel(item.date)
      }));
      
    case 'last30days':
      // 過去30日間のデータ
      return fixedMonthData.map(item => ({
        ...item,
        label: getShortLabel(item.date)
      }));
      
    case 'thisMonth':
      // 今月のデータ
      const firstDayOfMonth = new Date(MOCK_DATA_LATEST_DATE.getFullYear(), MOCK_DATA_LATEST_DATE.getMonth(), 1);
      result = fixedMonthData.filter(item => 
        new Date(item.date) >= firstDayOfMonth && 
        new Date(item.date) <= MOCK_DATA_LATEST_DATE
      );
      break;
      
    case 'lastMonth':
      // 先月のデータ
      const firstDayOfLastMonth = new Date(MOCK_DATA_LATEST_DATE.getFullYear(), MOCK_DATA_LATEST_DATE.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(MOCK_DATA_LATEST_DATE.getFullYear(), MOCK_DATA_LATEST_DATE.getMonth(), 0);
      result = fixedMonthData.filter(item => 
        new Date(item.date) >= firstDayOfLastMonth && 
        new Date(item.date) <= lastDayOfLastMonth
      );
      break;
      
    case 'custom':
      // カスタム期間のデータ
      if (startDate && endDate && startDate <= endDate) {
        result = fixedMonthData.filter(item => 
          item.date >= startDate && 
          item.date <= endDate
        );
      }
      break;
  }
  
  return result.map(item => ({
    ...item,
    label: getShortLabel(item.date)
  }));
};

// カスタム期間のデフォルト日付設定
const getDefaultCustomDates = () => {
  const today = MOCK_DATA_LATEST_DATE;
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  return {
    start: formatDate(lastMonth),
    end: formatDate(today)
  };
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('last30days');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [customStartDate, setCustomStartDate] = useState<string>(getDefaultCustomDates().start);
  const [customEndDate, setCustomEndDate] = useState<string>(getDefaultCustomDates().end);

  useEffect(() => {
    if (timeRange === 'custom') {
      setTrendData(getTrendData(timeRange, customStartDate, customEndDate));
    } else {
      setTrendData(getTrendData(timeRange));
    }
  }, [timeRange, customStartDate, customEndDate]);

  // 選択期間の集計データ
  const aggregatedData = {
    newUsers: trendData.reduce((sum, day) => sum + day.newUsers, 0),
    activeUsers: trendData.reduce((sum, day) => sum + day.activeUsers, 0),
    completions: trendData.reduce((sum, day) => sum + day.completions, 0),
    completionRate: trendData.length ? 
      Math.round((trendData.reduce((sum, day) => sum + day.completions, 0) / 
                 trendData.reduce((sum, day) => sum + day.activeUsers, 0)) * 100) : 0
  };

  // グラフのY軸データ生成
  const getYAxisTicks = (dataArray: number[]) => {
    if (dataArray.length === 0) return [{value: 50, label: "50"}, {value: 25, label: "25"}, {value: 0, label: "0"}];
    
    const dataMax = Math.max(...dataArray, 0);
    const topTickUnrounded = dataMax === 0 ? 10 : (Math.ceil(dataMax / (dataMax < 50 ? 5 : 10)) * (dataMax < 50 ? 5 : 10));
    const topTick = Math.max(10, topTickUnrounded); 
    const numIntervals = 4; 
    
    return Array.from({ length: numIntervals + 1 }, (_, i) => {
      const value = (topTick / numIntervals) * (numIntervals - i);
      return { value: Math.round(value), label: Math.round(value).toString() }; 
    });
  };

  // アクティブユーザーデータのY軸
  const activeUsersData = trendData.map(d => d.activeUsers);
  const activeUsersYAxis = getYAxisTicks(activeUsersData);
  const activeUsersTopValue = activeUsersYAxis[0]?.value || 10;

  // グラフタイトル
  const chartTitle = () => {
    if (timeRange === 'custom') {
      if (customStartDate && customEndDate && customStartDate <= customEndDate) {
        return `${getShortLabel(customStartDate)} ~ ${getShortLabel(customEndDate)} のユーザー動向`;
      }
      return 'カスタム期間のユーザー動向 (期間未設定)';
    }
    const selectedOption = timeRangeOptions.find(option => option.value === timeRange);
    return `${selectedOption?.label || '期間'}のユーザー動向`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">分析</h1>
        <div className="flex items-center">
          <div className="w-48">
            <Select
              options={timeRangeOptions}
              value={timeRange}
              onChange={(value) => {
                setTimeRange(value);
                if (value === 'custom') {
                  setCustomStartDate(getDefaultCustomDates().start);
                  setCustomEndDate(getDefaultCustomDates().end);
                }
              }}
            />
          </div>
        </div>
      </div>

      {timeRange === 'custom' && (
        <Card className="mb-6">
          <div className="p-4 flex items-end space-x-4">
            <div>
              <label htmlFor="customStartDate" className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <Input 
                type="date" 
                id="customStartDate"
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="customEndDate" className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <Input 
                type="date" 
                id="customEndDate"
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
                min={customStartDate}
                className="w-full"
              />
            </div>
          </div>
          {customStartDate && customEndDate && customStartDate > customEndDate && (
            <p className="p-4 text-red-600 text-sm">開始日は終了日より前に設定してください。</p>
          )}
        </Card>
      )}

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="overflow-visible">
          <div className="flex items-center justify-center p-4">
            <div className="mr-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                新規ユーザー
              </h3>
              <p className="text-3xl font-bold text-gray-900">{aggregatedData.newUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="overflow-visible">
          <div className="flex items-center justify-center p-4">
            <div className="mr-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Zap size={24} className="text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                アクティブユーザー
              </h3>
              <p className="text-3xl font-bold text-gray-900">{aggregatedData.activeUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="overflow-visible">
          <div className="flex items-center justify-center p-4">
            <div className="mr-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                LP生成完了数
              </h3>
              <p className="text-3xl font-bold text-gray-900">{aggregatedData.completions}</p>
            </div>
          </div>
        </Card>
        <Card className="overflow-visible">
          <div className="flex items-center justify-center p-4">
            <div className="mr-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <TrendingUp size={24} className="text-primary-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                完了率
              </h3>
              <p className="text-3xl font-bold text-gray-900">{aggregatedData.completionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ユーザー動向グラフ */}
      <Card 
        title={chartTitle()}
        headerAction={<BarChart2 size={16} className="text-primary-500" />}
        className="overflow-visible"
      >
        <div className="h-64 w-full p-4 flex">
          <div className="flex flex-col justify-between items-end h-full pr-3 text-xs text-gray-500" style={{ width: '3.5rem' }}>
            {activeUsersYAxis.map((tick, i) => (
              <div key={i} className="text-right">
                {tick.label}
                {i === 0 && <span className="ml-1">人</span>}
              </div>
            ))}
          </div>
          <div className="flex-1 h-full ml-1">
            {trendData.length > 0 ? (
              <div className="flex h-full items-end justify-between">
                {trendData.map((day, index) => {
                  // 高さ計算をシンプルに修正
                  const newUserHeight = Math.max(4, (day.newUsers / activeUsersTopValue) * 100);
                  const activeUserHeight = Math.max(4, (day.activeUsers / activeUsersTopValue) * 100);
                  
                  const barWidth = trendData.length === 1 ? 50 : 
                                 trendData.length <= 7 ? 30 : 
                                 trendData.length <= 15 ? 18 : 
                                 trendData.length <= 31 ? Math.max(8, Math.floor(250 / trendData.length)) : 
                                 trendData.length <= 60 ? Math.max(6, Math.floor(200 / trendData.length)) :
                                 Math.max(4, Math.floor(180 / trendData.length));
                  
                  return (
                    <div 
                      key={day.date + index} 
                      className="h-full flex flex-col items-center justify-end group"
                      style={{ 
                        width: trendData.length === 1 ? 'auto' : `${100 / trendData.length}%`,
                        minWidth: `${barWidth}px`,
                        flexBasis: trendData.length === 1 ? '100%' : 'auto',
                        margin: '0 1px'
                      }}
                    >
                      <div className="relative w-full flex flex-col items-center" style={{ height: '100%' }}>
                        {/* アクティブユーザー棒グラフ（下になるように先に配置） */}
                        <div 
                          style={{ 
                            position: 'absolute',
                            bottom: '0',
                            height: `${activeUserHeight}%`, 
                            width: `${barWidth}px`,
                            backgroundColor: '#10b981 !important',
                            borderRadius: '3px 3px 0 0',
                            minHeight: '4px',
                          }}
                          className="active-bar"
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                            アクティブ: {day.activeUsers}人
                            <br />
                            新規: {day.newUsers}人
                          </div>
                        </div>
                        
                        {/* 新規ユーザー棒グラフ（上に重ねて表示） */}
                        <div 
                          style={{ 
                            position: 'absolute',
                            bottom: '0',
                            height: `${newUserHeight}%`, 
                            width: `${barWidth}px`,
                            backgroundColor: '#3b82f6 !important',
                            borderRadius: '3px 3px 0 0',
                            minHeight: '4px',
                            zIndex: 5
                          }}
                          className="new-bar"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1.5 truncate text-center px-0.5 w-full" title={day.label}>
                        {day.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <p>{timeRange === 'custom' && !(customStartDate && customEndDate && customStartDate <= customEndDate) ? '有効なカスタム期間を設定してください。' : 'データがありません'}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* グラフ用スタイル */}
        <style>
          {`
            .active-bar {
              background-color: #10b981 !important;
            }
            .new-bar {
              background-color: #3b82f6 !important;
              z-index: 5;
            }
          `}
        </style>
        
        {/* 凡例 */}
        <div className="flex justify-center mt-2 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-blue-500 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-xs text-gray-600">新規ユーザー</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-green-500 rounded-sm" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-xs text-gray-600">アクティブユーザー</span>
          </div>
        </div>
      </Card>
      
      {/* ビジネスインサイト - 2分割 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* コンバージョン率 */}
        <Card title="業種別コンバージョン率" headerAction={<TrendingUp size={16} className="text-primary-500" />} className="overflow-visible">
          <div className="space-y-4 p-4">
            <div className="mb-6">
              <p className="text-center text-3xl font-bold text-primary-600 mb-2">{baseMockData.conversionRates.overall}%</p>
              <p className="text-center text-sm text-gray-500">全体平均コンバージョン率</p>
            </div>
            
            {Object.entries(baseMockData.conversionRates.byIndustry).map(([industry, rate]) => {
              const percentage = rate;
              const percentageVsAvg = ((rate / baseMockData.conversionRates.overall) - 1) * 100;
              const isAboveAverage = percentageVsAvg >= 0;
              
              return (
                <div key={industry} className="flex items-center">
                  <div className="w-36 text-sm text-gray-600 truncate" title={industry}>{industry}</div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${isAboveAverage ? 'bg-green-500' : 'bg-orange-500'} rounded-full transition-all duration-500 ease-in-out`}
                        style={{ width: `${percentage * 10}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">
                    {percentage}%
                  </div>
                  <div className={`w-20 text-right text-sm font-medium ${isAboveAverage ? 'text-green-600' : 'text-orange-600'}`}>
                    {isAboveAverage ? '+' : ''}{percentageVsAvg.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        {/* 企業規模分布 */}
        <Card title="ユーザー企業規模分布" headerAction={<PieChart size={16} className="text-primary-500" />} className="overflow-visible">
          <div className="space-y-4 p-4">
            {Object.entries(baseMockData.userDemographics.companySize).map(([size, percentage]) => {
              return (
                <div key={size} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600 truncate">{size}</div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${percentage * 2}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-900">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ユーザー行動データと地域分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ユーザー行動データ */}
        <Card title="ユーザー行動指標" headerAction={<Clock size={16} className="text-primary-500" />} className="overflow-visible">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">平均セッション時間</p>
                <p className="text-2xl font-bold text-gray-800">{baseMockData.userBehavior.averageSessionDuration}<span className="text-sm ml-1">分</span></p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">平均回答質問数</p>
                <p className="text-2xl font-bold text-gray-800">{baseMockData.userBehavior.averageQuestionsCompleted}<span className="text-sm ml-1">問</span></p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">コンテンツ生成率</p>
                <p className="text-2xl font-bold text-green-600">{baseMockData.userBehavior.contentGenerationRate}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">リピート率</p>
                <p className="text-2xl font-bold text-blue-600">{baseMockData.userBehavior.returnRate}%</p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* 地域分布 */}
        <Card title="ユーザー地域分布" headerAction={<Map size={16} className="text-primary-500" />} className="overflow-visible">
          <div className="space-y-4 p-4">
            {Object.entries(baseMockData.regionalData).map(([region, percentage]) => {
              return (
                <div key={region} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600 truncate">{region}</div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${percentage * 2}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-900">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics; 