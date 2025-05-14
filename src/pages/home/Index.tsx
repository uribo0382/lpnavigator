import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Megaphone, FileEdit } from 'lucide-react';

const Index: React.FC = () => {
  const menuItems = [
    {
      title: '基本情報生成',
      icon: <FileText size={48} className="text-primary-500 mb-2" />,
      description: 'あなたの商品やサービスに関する質問に答えるだけで、ChatGPTが最適な基本情報を自動生成します。管理者が設定した基本情報フォーミュラをもとに、質問の回答を組み合わせて高品質なコンテンツを作成します。',
      buttonText: '基本情報を作成',
      path: '/generator',
    },
    {
      title: '広告文生成',
      icon: <Megaphone size={48} className="text-primary-500 mb-2" />,
      description: '基本情報をもとに、魅力的な広告文を自動生成します。複数のAIモデルで生成した結果を比較し、最適な広告文を選択できます。',
      buttonText: '広告文を作成',
      path: '/generator/adcopy/create',
    },
    {
      title: 'LP記事生成',
      icon: <FileEdit size={48} className="text-primary-500 mb-2" />,
      description: '基本情報と広告文をもとに、ランディングページ用の記事を自動生成します。詳細な商品説明や特徴を盛り込んだコンテンツを簡単に作成できます。',
      buttonText: 'LP記事を作成',
      path: '/generator/lparticle/create',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">LP作成支援サービス</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">{item.title}</h2>
            <p className="text-gray-600 mb-6 flex-grow">{item.description}</p>
            <Link
              to={item.path}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
            >
              {item.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index; 