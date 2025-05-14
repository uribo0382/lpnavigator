import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, Download, Eye, Trash2, X, Copy, Edit, Check, Save, FileText, Clock, ArrowUpRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { mockContentHistory } from '../../utils/mockData';

// 保存データの型定義
interface SavedData {
  id: string;
  title: string;
  date: string;
  progress: number;
  answers: Record<string, string>;
}

// 新しい保存データモック（3件）
const mockSavedItemsData: SavedData[] = [
  {
    id: 'saved-lp-001',
    title: 'オンライン学習サービス提案書',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 75,
    answers: {
      '1': 'プログラミング学習プラットフォーム「CodeMaster」',
      '2': '未経験からエンジニア転職を目指す25〜40代の社会人',
      '3': '現役エンジニアによるマンツーマン指導と実践的なプロジェクト課題',
      '4': '転職成功率98％、初心者でも6ヶ月で即戦力に',
      '5': '受講料全額返金保証制度あり'
    }
  },
  {
    id: 'saved-lp-002',
    title: '健康食品新商品企画書',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 45,
    answers: {
      '1': '発酵大豆パワーサプリメント「ソイヴィタル」',
      '2': '健康意識が高い40〜60代の男女',
      '3': '国産大豆100%使用、無添加製法による高品質サプリメント',
      '4': '継続的な摂取による免疫力向上と疲労回復効果'
    }
  },
  {
    id: 'saved-lp-003',
    title: 'コンサルティングサービス提案',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 30,
    answers: {
      '1': '中小企業向けDX推進コンサルティング「デジタルシフトパートナー」',
      '2': '従業員50名以下の製造業・小売業の経営者',
      '3': '低コストで導入可能なDXソリューションの提案と実装支援'
    }
  }
];

// モック履歴データを拡張 (生成済み基本情報用)
const mockGeneratedLPs = [
  {
    id: '1',
    title: 'クラウド会計ソフトウェア基本情報',
    createdAt: new Date(2023, 5, 10),
    metaDescription: '中小企業向けクラウド会計ソフトウェアの特徴と導入メリットについての基本情報です。',
    permalink: 'cloud-accounting-software-info',
    model: 'gpt-4o',
    wordCount: 850,
    excerpt: 'クラウド会計ソフトウェアの基本情報と導入メリット',
    status: 'completed',
    content: `株式会社FinTechソリューションズが提供するクラウド会計ソフトウェア「SmartAccounts」に関する基本情報です。

【商品・サービスの概要】
SmartAccountsは、中小企業向けのクラウド型会計ソフトウェアで、請求書発行から経費管理、決算書作成まで一気通貫で対応します。インターネット環境があればいつでもどこでも利用可能で、モバイルアプリにも対応しています。

【主な特徴】
- AI搭載のレシート読取機能で経費精算の手間を90%削減
- 銀行口座やクレジットカードと自動連携し、取引データを自動取得
- 税務申告に必要な書類を自動生成し、電子申告にも対応

【想定されるお客様】
従業員50名以下の中小企業、個人事業主、フリーランス。特に、経理担当者が少ない、または経理業務の効率化を図りたい企業に最適です。

【解決できる課題】
経理業務の属人化、手作業による記帳ミス、確定申告時の書類作成負担、リモートワーク時の経理業務遅延などの課題を解決します。

【提供価値】
経理業務の時間を最大70%削減し、本業に集中できる環境を提供します。また、リアルタイムの経営状況の可視化により、的確な経営判断をサポートします。

【料金体系】
スタータープラン：月額5,000円（年間契約で20%オフ）
ビジネスプラン：月額10,000円（年間契約で20%オフ）
エンタープライズプラン：月額20,000円（年間契約で20%オフ）
すべてのプランで14日間の無料トライアル可能。

【導入事例】
株式会社山田製作所（製造業、従業員30名）：経理業務時間が週15時間から5時間に削減
cafe Bloom（飲食業、従業員8名）：売上・経費の可視化により、利益率が15%向上
佐藤デザイン事務所（個人事業主）：確定申告準備時間が3日から半日に短縮

【お問い合わせ方法】
電話：03-1234-5678（平日9:00-18:00）
メール：info@smartaccounts.jp
公式サイト：https://www.smartaccounts.jp/contact`
  },
  {
    id: '2',
    title: 'オーガニック食品宅配サービス基本情報',
    createdAt: new Date(2023, 5, 15),
    metaDescription: '無農薬・有機栽培の新鮮食材を定期宅配するサービスについての基本情報です。',
    permalink: 'organic-food-delivery-info',
    model: 'claude-3-opus',
    wordCount: 920,
    excerpt: 'オーガニック食品宅配サービスの概要と特徴',
    status: 'completed',
    content: `株式会社グリーンテーブルが提供する「オーガニックライフ」に関する基本情報です。

【商品・サービスの概要】
オーガニックライフは、全国の厳選された有機栽培農家から直接仕入れた新鮮な野菜や果物、加工食品を定期的にご自宅にお届けする宅配サービスです。すべての食材は有機JAS認証を取得しており、安心・安全な食生活をサポートします。

【主な特徴】
- 契約農家から直送される完全無農薬・有機栽培の新鮮野菜
- 旬の食材を活かしたレシピ提案とミールキット同梱オプション
- 食材の生産者情報と栽培方法の完全開示による透明性

【想定されるお客様】
健康や食の安全性に関心の高い30〜50代の家族世帯、特に小さなお子様がいるご家庭や、食材の品質にこだわる方々。また、忙しくてスーパーに買い物に行く時間がない共働き世帯にも最適です。

【解決できる課題】
市販の食品に含まれる農薬や添加物への不安、忙しい日常での食材調達の時間的負担、食材の産地や栽培方法の不透明さなどの課題を解決します。

【提供価値】
安心・安全な食材を通じた家族の健康維持、食材調達にかかる時間の削減、環境に配慮した持続可能な消費活動への参加、地域農業の活性化への貢献などの価値を提供します。

【料金体系】
ベーシックセット（2〜3人家族向け）：週1回 3,980円
ファミリーセット（4〜5人家族向け）：週1回 5,980円
カスタムセット（好きな食材を選択）：週1回 基本料2,000円+選択食材料金
すべてのプランで初回お試し50%オフキャンペーン実施中。

【導入事例】
佐藤家（4人家族）：子どもの食物アレルギーに対する不安が解消され、家族全員の食事の質が向上
田中家（共働き夫婦）：食材買い出しの時間が週3時間削減され、週末の余暇時間が増加
山本さん（一人暮らし）：栄養バランスの良い食事で健康診断の数値が改善

【お問い合わせ方法】
電話：0120-123-456（毎日9:00-20:00）
メール：support@organiclife.jp
公式サイト：https://www.organiclife.jp/contact`
  },
  {
    id: '3',
    title: 'オンラインヨガスタジオ基本情報',
    createdAt: new Date(2023, 5, 20),
    metaDescription: '自宅で気軽に参加できるライブ配信・オンデマンドのヨガレッスンサービスについての基本情報です。',
    permalink: 'online-yoga-studio-info',
    model: 'gpt-4o',
    wordCount: 780,
    excerpt: 'オンラインヨガスタジオの特徴と利用方法',
    status: 'completed',
    content: `YogaLifeStudioが提供する「どこでもヨガ」に関する基本情報です。

【商品・サービスの概要】
どこでもヨガは、自宅や外出先から参加できるオンラインヨガスタジオです。ライブクラスとオンデマンドレッスンを組み合わせたハイブリッド型で、場所や時間を選ばずに本格的なヨガレッスンを受講できます。初心者から上級者まで、様々なレベルやスタイルのクラスを提供しています。

【主な特徴】
- 一流インストラクターによるライブクラスを毎日20本以上配信
- 500本以上のレッスン動画がいつでも視聴可能なオンデマンドライブラリ
- インストラクターからリアルタイムでポーズの修正やアドバイスが受けられる双方向コミュニケーション

【想定されるお客様】
忙しい仕事や育児でスタジオに通う時間がない方、自宅で気軽にヨガを始めたい初心者、対面レッスンに抵抗がある方、地方在住でヨガスタジオへのアクセスが限られている方など。年齢層は20代から60代まで幅広く対応。

【解決できる課題】
スタジオまでの移動時間や固定スケジュールの制約、初心者の対面レッスンへの心理的ハードル、地方在住者のヨガ教室へのアクセス制限、コロナ禍における運動不足などの課題を解決します。

【提供価値】
時間や場所を選ばない柔軟なレッスン参加による健康維持・ストレス軽減、自分のペースでの継続的な練習環境の提供、オンラインでありながらパーソナルな指導を受けられるコミュニティ体験を提供します。

【料金体系】
ベーシックプラン：月額4,980円（オンデマンド動画見放題）
プレミアムプラン：月額7,980円（オンデマンド見放題＋週3回ライブクラス参加可能）
アンリミテッドプラン：月額12,980円（オンデマンド見放題＋ライブクラス無制限参加）
すべてのプランで7日間の無料トライアル可能。年間契約で20%オフ。

【導入事例】
鈴木さん（32歳、会社員）：通勤時間削減により週3回の継続的な参加が可能になり、慢性的な肩こりが改善
高橋さん（45歳、主婦）：子どもの送迎の合間にレッスン参加が可能になり、ストレス軽減と睡眠の質向上を実感
佐々木さん（58歳、自営業）：対面レッスンへの抵抗感がなくなり、半年間で体重5kg減、体力向上を達成

【お問い合わせ方法】
メール：info@dokodemo-yoga.jp
LINE公式アカウント：@dokodemo-yoga
公式サイト：https://www.dokodemo-yoga.jp/contact
電話サポート：平日10:00-18:00（0120-567-890）`
  }
];

interface ItemToDelete {
  id: string;
  type: 'saved' | 'completed';
}

const ContentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGeneratedLPs, setFilteredGeneratedLPs] = useState(mockGeneratedLPs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedData[]>([]);
  const [activeTab, setActiveTab] = useState('completed');
  const [error, setError] = useState<string | null>(null);

  // 削除確認ダイアログ用 state
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);

  // 初期表示でモックデータを登録
  useEffect(() => {
    setSavedItems(mockSavedItemsData);
    localStorage.setItem('lp_navigator_saved_list', JSON.stringify(mockSavedItemsData));
    // localStorageからタブ状態を取得
    const savedTab = localStorage.getItem('lp_navigator_history_tab');
    if (savedTab === 'saved') {
      setActiveTab('saved');
      // 使用後にクリア
      localStorage.removeItem('lp_navigator_history_tab');
    } else {
      setActiveTab('completed');
    }
  }, []);

  // 検索処理 (生成済みLPと保存データの両方に対応)
  useEffect(() => {
    try {
      if (activeTab === 'completed') {
        if (!searchTerm.trim()) {
          setFilteredGeneratedLPs(mockGeneratedLPs);
          return;
        }
        const filtered = mockGeneratedLPs.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.metaDescription.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGeneratedLPs(filtered);
      } else { // activeTab === 'saved'
        // 保存データ用のフィルタ処理は map 時に行う
      }
    } catch (searchError) {
      console.error('Search error:', searchError);
      setError('検索処理中にエラーが発生しました。');
    }
  }, [searchTerm, activeTab]);

  const formatDateDisplay = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 削除ボタンクリック時の処理 (ダイアログ表示をトリガー)
  const handleDeleteItem = (id: string) => {
    setItemToDelete({ id, type: activeTab as 'saved' | 'completed' });
    setShowDeleteConfirmDialog(true);
  };

  // 確認ダイアログで「削除」をクリックしたときの処理
  const executeDelete = () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    setSelectedId(id); // ローディング表示用 (削除処理中)

    setTimeout(() => {
      try {
        if (type === 'saved') {
          const updatedSavedItems = savedItems.filter(item => item.id !== id);
          setSavedItems(updatedSavedItems);
          localStorage.setItem('lp_navigator_saved_list', JSON.stringify(updatedSavedItems));
          setError(null);
        } else { // type === 'completed'
          setFilteredGeneratedLPs(prevLPs => prevLPs.filter(item => item.id !== id));
          setError(null);
        }
      } catch (deleteError) {
        console.error(`Failed to delete ${type} item:`, deleteError);
        setError(`${type === 'saved' ? '保存済み' : '生成済み'}アイテムの削除中にエラーが発生しました。`);
      }
      setSelectedId(null); // ローディング解除
      setShowDeleteConfirmDialog(false);
      setItemToDelete(null);
    }, 800);
  };

  const handleViewItem = (id: string) => {
    try {
      const item = filteredGeneratedLPs.find(i => i.id === id);
      if (item) {
        // 選択した基本情報をローカルストレージに保存
        localStorage.setItem('lp_navigator_generated_content', JSON.stringify(item));
        
        // 基本情報詳細ページへ遷移
        navigate('/generator/content');
      }
    } catch (error) {
      console.error('View item error:', error);
      setError('コンテンツの表示中にエラーが発生しました。');
    }
  };

  const handleEditSavedItem = async (item: SavedData) => {
    try {
      // LocalStorageにアンサーをセット
      localStorage.setItem('lp_navigator_answers', JSON.stringify(item.answers));
      localStorage.setItem('lp_navigator_last_saved', item.id);
      
      // 少し遅延を入れて状態が確実に保存されるようにする
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 編集画面へ遷移
      navigate('/generator', { 
        state: { 
          fromHistory: true, 
          savedDataId: item.id 
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setError('ページ遷移中にエラーが発生しました。ページを再読み込みしてください。');
      
      // エラー時のフォールバック
      setTimeout(() => { 
        try {
          window.location.href = '/generator'; 
        } catch (e) {
          console.error('Fallback navigation failed:', e);
        }
      }, 1500);
    }
  };

  const handleDownloadItem = (item: typeof mockGeneratedLPs[0]) => {
    try {
      const element = document.createElement('a');
      const file = new Blob([item.content], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = `${item.permalink || 'lp-content'}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Download error:', error);
      setError('ダウンロード中にエラーが発生しました。');
    }
  };

  // 保存データタブで表示するアイテムリスト (検索対応)
  const displayedSavedItems = searchTerm.trim() 
    ? savedItems.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : savedItems;

  // 進捗状況の色を決定する関数
  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ef4444'; // 赤
    if (progress < 70) return '#f59e0b'; // オレンジ
    return '#10b981'; // 緑
  };

  return (
    <div className="flex-1 overflow-y-auto p-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">基本情報一覧</h1>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-4">
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </Button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2 text-primary-500" />
            基本情報検索
          </h2>
        </div>

        <div className="flex mb-6 border-b">
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'completed' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            生成済み基本情報
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'saved' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            保存データ
          </button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="タイトルで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>
      </div>

      <Card className="p-4 md:p-6">
        {activeTab === 'completed' ? (
          <div className="space-y-6">
            {filteredGeneratedLPs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">該当する記事が見つかりませんでした。</p>
              </div>
            ) : (
              filteredGeneratedLPs.map((item) => (
                <div key={item.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => handleViewItem(item.id)}
                      >
                        表示
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeleteItem(item.id)}
                        isLoading={selectedId === item.id && activeTab === 'completed'}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.metaDescription}</p>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500">
                    <div>生成日時: {formatDateDisplay(item.createdAt)}</div>
                    <div>使用モデル: {item.model}</div>
                    <div>文字数: 約{item.wordCount}文字</div>
                    <div className="flex items-center">
                      パーマリンク: 
                      <a 
                        href={`/generator/content/${item.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        {item.permalink}
                        <ExternalLink size={12} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : ( // activeTab === 'saved'
          <div className="space-y-6">
            {displayedSavedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">保存されたデータがありません。</p>
                <Button
                  variant="outline"
                  leftIcon={<FileText size={16} />}
                  onClick={() => navigate('/generator')} // Navigate to creation flow
                  className="mt-4"
                >
                  新しいLP記事を作成
                </Button>
              </div>
            ) : (
              displayedSavedItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FileText size={18} className="mr-2 text-primary-500" />
                      {item.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ArrowUpRight size={14} />}
                        onClick={() => handleEditSavedItem(item)}
                      >
                        編集を続ける
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeleteItem(item.id)}
                        isLoading={selectedId === item.id && activeTab === 'saved'}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {formatDateDisplay(item.date)}
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs font-medium text-gray-500 mr-2">
                        進捗状況: {Math.round(item.progress)}%
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${item.progress}%`,
                            backgroundColor: getProgressColor(item.progress)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={() => {
          setShowDeleteConfirmDialog(false);
          setItemToDelete(null);
        }}
        title={`${itemToDelete?.type === 'saved' ? '保存データ' : '基本情報'}を削除しますか？`}
        message={`この${itemToDelete?.type === 'saved' ? '保存データ' : '基本情報'}は完全に削除され、元に戻すことはできません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default ContentHistory;