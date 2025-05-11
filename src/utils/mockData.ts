// Mock data for demonstration purposes

export const mockQuestions = [
  {
    id: '1',
    text: '商品は？',
    category: 'features',
    order: 1,
    isActive: true,
    helperText: '提供する商品やサービスについて簡潔に説明してください。',
    sampleAnswer: '当社の「AI文章作成ツール」は、マーケティング担当者やコンテンツクリエイターが高品質な文章を簡単に作成できるAIパワードツールです。',
    isRequired: true
  },
  {
    id: '2',
    text: '商品の特徴や独自性は？',
    category: 'features',
    order: 2,
    isActive: true,
    helperText: '他の商品と比べて、どのような特徴や強みがありますか？',
    sampleAnswer: '業界特化型の学習モデルを採用し、マーケティング、SEO、コンバージョン最適化に特化した文章を生成します。また、ユーザーのブランドボイスに合わせた文体調整機能も搭載しています。',
    isRequired: true
  },
  {
    id: '3',
    text: '行動喚起（とってほしい行動）は？',
    category: 'cta',
    order: 3,
    isActive: true,
    helperText: 'ユーザーにどのような行動を取ってほしいですか？（例：購入、問い合わせ、申し込みなど）',
    sampleAnswer: '今すぐ無料トライアルに登録して、AIの力でコンテンツ作成の効率を10倍に高めましょう。最初の30日間は全機能が無料でお試しいただけます。',
    isRequired: true
  },
  {
    id: '4',
    text: 'オファーは？',
    category: 'offer_details',
    order: 4,
    isActive: true,
    helperText: 'ユーザーに提供する具体的なオファーについて説明してください。（例：割引、特典、無料トライアルなど）',
    sampleAnswer: '今月末までの期間限定で、年間プランが30%オフ。さらに、登録後14日以内に年間プランにアップグレードすると、プレミアムテンプレート集（通常9,800円）を無料でプレゼント。',
    isRequired: false
  },
  {
    id: '5',
    text: 'オファーの限定性や理由は？',
    category: 'offer_details',
    order: 5,
    isActive: true,
    helperText: 'なぜこのオファーが限定的なのか、または今行動を起こすべき理由について説明してください。',
    sampleAnswer: 'このプロモーションは新機能リリースを記念した特別オファーで、先着100名様限定です。すでに80%以上が埋まっており、この機会を逃すと通常価格でのご提供となります。'
  },
  {
    id: '6',
    text: 'オファーに関する社会的証明は？',
    category: 'social_proof',
    order: 6,
    isActive: true,
    helperText: 'お客様の声や実績など、商品の信頼性を高める要素があれば記入してください。',
    sampleAnswer: '既に500社以上の企業が導入し、平均でコンテンツ制作時間を67%削減、マーケティングROIを28%向上させています。特に株式会社ABCは当ツールを活用してオーガニック流入を3ヶ月で2倍に増加させました。'
  },
  {
    id: '7',
    text: '特典は？',
    category: 'benefits',
    order: 7,
    helperText: '商品購入やサービス利用時に提供される特典があれば記入してください。',
    sampleAnswer: '年間プラン契約者には、毎月開催される「AIコンテンツ最適化セミナー」（一般参加費5,000円）への無料参加権と、専門コンサルタントによる60分の個別戦略相談（通常20,000円）を提供します。'
  },
  {
    id: '8',
    text: 'アバターは？',
    category: 'problem',
    order: 8,
    isActive: true,
    helperText: 'ターゲットとなる理想的な顧客像について説明してください。（年齢、性別、職業、趣味など）',
    sampleAnswer: '中小企業のマーケティング担当者（25〜45歳）で、少ないリソースで多くの成果を出すことを求められている方。特にデジタルマーケティングに取り組みつつも、コンテンツ制作に時間を取られている担当者が理想的なユーザーです。'
  },
  {
    id: '9',
    text: 'アバターの問題や悩みは？',
    category: 'problem',
    order: 9,
    isActive: true,
    helperText: 'ターゲットが抱えている問題や悩みは何ですか？',
    sampleAnswer: '質の高いコンテンツを定期的に作成する必要があるが、時間とリソースが限られている。特にSEOに最適化された文章作成は専門知識が必要で、外注すると高コストになる一方、自社制作は時間がかかりすぎるというジレンマを抱えています。',
    isRequired: true
  },
  {
    id: '10',
    text: 'アバターの問題の原因は？',
    category: 'problem',
    order: 10,
    isActive: true,
    helperText: 'その問題が発生している原因は何だと考えられますか？',
    sampleAnswer: 'マーケティング担当者の業務が多岐にわたる中、コンテンツ制作だけに集中できない組織構造の問題。また、SEOやコンバージョン最適化の専門知識と文章力の両方を持つ人材確保が難しく、既存ツールは汎用的すぎて業界特化の文章が生成できない技術的限界があります。'
  },
  {
    id: '11',
    text: 'アバターの欲求や理想の未来は？',
    category: 'solution',
    order: 11,
    isActive: true,
    helperText: 'ターゲットが理想とする状態や達成したい目標は何ですか？',
    sampleAnswer: 'コンテンツ制作の時間を大幅に削減しながらも、検索エンジンで上位表示され、読者の心に響き、高いコンバージョン率を実現するコンテンツを簡単に作成できる状態。それにより本来注力すべき戦略立案や分析により多くの時間を使えるようになることを望んでいます。'
  },
  {
    id: '12',
    text: 'この商品は他商品と違って？',
    category: 'features',
    order: 12,
    isActive: true,
    helperText: '競合製品や代替手段と比較した際の優位性について説明してください。',
    sampleAnswer: '一般的なAIライティングツールと異なり、業界別（EC、BtoB、不動産など）の特化型モデルを選択できる唯一のツール。また、SEO分析機能とコンテンツ作成が一体化しており、キーワード選定から最適化までをワンストップで完結できます。',
    isRequired: true
  },
  {
    id: '13',
    text: '商品によって得られる結果は？',
    category: 'benefits',
    order: 13,
    isActive: true,
    helperText: '商品を使用することで得られる具体的な結果や効果について説明してください。',
    sampleAnswer: 'コンテンツ制作時間を最大70%削減しながら、SEOランキング向上とコンバージョン率平均15%アップを実現。ユーザー企業の90%が3ヶ月以内に投資回収に成功し、半数以上が6ヶ月以内にオーガニックトラフィックを2倍以上に増加させています。',
    isRequired: true
  },
  {
    id: '14',
    category: 'cta',
    order: 14,
    isActive: false,
    helperText: '商品の使い方や利用開始までの簡単なステップがあれば記入してください。',
    sampleAnswer: 'メールアドレスを入力して登録するだけで、5分以内に最初のAI生成コンテンツが完成します。テーマを入力し、業界タイプを選択し、「生成」ボタンを押すだけの3ステップで、SEO最適化された高品質なコンテンツが手に入ります。'
  },
  {
    id: '15',
    text: '商品についてアバターが驚くようなことや意外なことや興味深いことは？',
    category: 'pricing',
    order: 15,
    isActive: false,
    helperText: 'ターゲットの注目を引きつける意外な事実や興味深い情報があれば記入してください。',
    sampleAnswer: '当ツールが生成した記事と人間のプロライターが書いた記事を比較するブラインドテストでは、マーケティング担当者の78%が当ツールの文章を人間が書いたものと誤認しました。さらに、AIが作成した商品説明文を使用した場合、使用していない場合と比べて平均で購入率が23%向上するという調査結果も出ています。'
  },
  {
    id: '16',
    text: '商品・サービスの保証内容は？',
    category: 'guarantee',
    isActive: true,
    helperText: '返金保証や品質保証など、顧客の不安を取り除く保証内容があれば記入してください。',
    sampleAnswer: '30日間の返金保証付き。もし期待した効果が得られなかった場合、理由を問わず全額返金いたします。さらに、1年間の技術サポート保証があり、導入後のトラブルにも迅速に対応します。お客様満足度99.7%の実績があります。'
  },
  {
    id: '17',
    text: 'よくある質問とその回答は？',
    category: 'faq',
    order: 17,
    isActive: true,
    helperText: '潜在顧客がよく抱く疑問や質問への回答をリストアップしてください。',
    sampleAnswer: 'Q：導入にどれくらいの時間がかかりますか？ A：通常5分以内にアカウント設定が完了し、すぐに使い始められます。\nQ：既存のツールと連携できますか？ A：はい、Slack、Google Drive、Notion、WordPressなど主要20種類以上のツールと連携可能です。\nQ：大規模なコンテンツ制作も可能ですか？ A：もちろん可能です。エンタープライズプランでは月間100万語まで対応しています。'
  }
];

// 新しいユーザーモックデータ
export const mockUsers = [
  {
    id: 'admin-001',
    name: '管理者ユーザー',
    email: 'admin@example.com',
    role: 'admin',
    plan: 'enterprise',
    isActive: true,
    createdAt: new Date(2023, 0, 15),
    lastLoginAt: new Date(2023, 9, 5, 14, 30),
    company: '株式会社LPナビゲーター',
    position: 'システム管理者',
    phone: '03-1234-5678',
    notes: '管理者アカウント（デモ用）',
    usageLimit: 0,
    apiAccess: true,
    usage: {
      lpGenerated: 28,
      apiCalls: 156
    }
  },
  {
    id: 'user-001',
    name: '佐藤 太郎',
    email: 'taro@example.com',
    role: 'user',
    plan: 'premium',
    isActive: true,
    createdAt: new Date(2023, 1, 10),
    lastLoginAt: new Date(2023, 9, 1, 9, 45),
    company: '株式会社マーケットプラス',
    position: 'マーケティング部長',
    phone: '03-9876-5432',
    notes: 'プレミアムユーザー。サポート対応優先。',
    usageLimit: 50,
    apiAccess: true,
    usage: {
      lpGenerated: 42,
      apiCalls: 78
    }
  },
  {
    id: 'user-002',
    name: '鈴木 花子',
    email: 'hanako@example.com',
    role: 'user',
    plan: 'basic',
    isActive: true,
    createdAt: new Date(2023, 2, 5),
    lastLoginAt: new Date(2023, 9, 3, 16, 20),
    company: 'デザインスタジオMOON',
    position: 'デザイナー',
    phone: '090-1234-5678',
    notes: '',
    usageLimit: 20,
    apiAccess: false,
    usage: {
      lpGenerated: 16,
      apiCalls: 0
    }
  },
  {
    id: 'user-003',
    name: '田中 一郎',
    email: 'ichiro@example.com',
    role: 'user',
    plan: 'free',
    isActive: false,
    createdAt: new Date(2023, 3, 20),
    lastLoginAt: new Date(2023, 7, 25, 11, 15),
    company: '個人事業主',
    position: 'フリーランス',
    phone: '080-8765-4321',
    notes: '無料トライアル期間終了。アップグレード検討中。',
    usageLimit: 10,
    apiAccess: false,
    usage: {
      lpGenerated: 7,
      apiCalls: 0
    }
  },
  {
    id: 'user-004',
    name: '山田 裕子',
    email: 'yuko@example.com',
    role: 'user',
    plan: 'premium',
    isActive: true,
    createdAt: new Date(2023, 4, 3),
    lastLoginAt: new Date(2023, 9, 4, 13, 10),
    company: 'テックソリューション株式会社',
    position: 'セールスマネージャー',
    phone: '03-5678-1234',
    notes: 'エンタープライズプランへのアップグレード検討中。',
    usageLimit: 100,
    apiAccess: true,
    usage: {
      lpGenerated: 65,
      apiCalls: 120
    }
  },
  {
    id: 'user-005',
    name: '高橋 誠',
    email: 'makoto@example.com',
    role: 'user',
    plan: 'basic',
    isActive: true,
    createdAt: new Date(2023, 5, 15),
    lastLoginAt: new Date(2023, 8, 29, 10, 5),
    company: '合同会社クリエイト',
    position: 'コンテンツディレクター',
    phone: '03-2345-6789',
    notes: '',
    usageLimit: 20,
    apiAccess: false,
    usage: {
      lpGenerated: 12,
      apiCalls: 0
    }
  },
  {
    id: 'user-006',
    name: '伊藤 洋子',
    email: 'yoko@example.com',
    role: 'user',
    plan: 'enterprise',
    isActive: true,
    createdAt: new Date(2023, 6, 7),
    lastLoginAt: new Date(2023, 9, 2, 15, 30),
    company: 'グローバルマーケティング株式会社',
    position: 'CEO',
    phone: '03-3456-7890',
    notes: '大口顧客。VIP対応必須。',
    usageLimit: 0,
    apiAccess: true,
    usage: {
      lpGenerated: 124,
      apiCalls: 567
    }
  },
  {
    id: 'user-007',
    name: '中村 健太',
    email: 'kenta@example.com',
    role: 'user',
    plan: 'premium',
    isActive: true,
    createdAt: new Date(2023, 7, 12),
    lastLoginAt: new Date(2023, 9, 5, 9, 45),
    company: 'スタートアップファクトリー',
    position: 'マーケティングコンサルタント',
    phone: '090-9876-5432',
    notes: '',
    usageLimit: 50,
    apiAccess: true,
    usage: {
      lpGenerated: 32,
      apiCalls: 45
    }
  },
  {
    id: 'admin-002',
    name: '小林 直人',
    email: 'naoto@example.com',
    role: 'admin',
    plan: 'enterprise',
    isActive: true,
    createdAt: new Date(2023, 8, 1),
    lastLoginAt: new Date(2023, 9, 4, 17, 20),
    company: '株式会社LPナビゲーター',
    position: 'プロダクトマネージャー',
    phone: '03-8765-4321',
    notes: '開発チーム管理者',
    usageLimit: 0,
    apiAccess: true,
    usage: {
      lpGenerated: 18,
      apiCalls: 245
    }
  },
  {
    id: 'user-008',
    name: '斎藤 美咲',
    email: 'misaki@example.com',
    role: 'user',
    plan: 'basic',
    isActive: false,
    createdAt: new Date(2023, 8, 15),
    lastLoginAt: null,
    company: '個人事業主',
    position: 'ウェブデザイナー',
    phone: '080-1234-5678',
    notes: '登録後ログインなし。フォローアップ必要。',
    usageLimit: 20,
    apiAccess: false,
    usage: {
      lpGenerated: 0,
      apiCalls: 0
    }
  }
];

// モックのLP記事生成履歴データ
export const mockContentHistory = [
  {
    id: '1',
    title: 'AIコンテンツ作成ツールの紹介',
    createdAt: new Date(2023, 5, 10),
    metaDescription: 'AIを活用したコンテンツ作成ツールで、効率的に高品質な記事を生成しましょう。',
    permalink: 'ai-content-tool-introduction',
    model: 'gpt-4o',
    wordCount: 1250,
  },
  {
    id: '2',
    title: 'デジタルマーケティング支援サービス',
    createdAt: new Date(2023, 5, 15),
    metaDescription: '最新のデジタルマーケティング手法を活用し、あなたのビジネスを成長させます。',
    permalink: 'digital-marketing-service',
    model: 'claude-3-opus',
    wordCount: 1500,
  },
  {
    id: '3',
    title: '自動化ワークフローツール',
    createdAt: new Date(2023, 5, 20),
    metaDescription: '業務効率を向上させる自動化ワークフローツールで、時間とコストを削減します。',
    permalink: 'workflow-automation-tool',
    model: 'gpt-4o',
    wordCount: 980,
  },
  {
    id: '4',
    title: 'プレミアムSEOコンサルティング',
    createdAt: new Date(2023, 5, 25),
    metaDescription: '検索エンジン最適化のプロフェッショナルが、あなたのウェブサイトのランキングを向上させます。',
    permalink: 'premium-seo-consulting',
    model: 'gpt-3.5-turbo',
    wordCount: 1100,
  },
  {
    id: '5',
    title: 'クラウドストレージソリューション',
    createdAt: new Date(2023, 6, 1),
    metaDescription: '安全で信頼性の高いクラウドストレージで、あなたの大切なデータを保護します。',
    permalink: 'cloud-storage-solution',
    model: 'claude-3-opus',
    wordCount: 1300,
  },
];