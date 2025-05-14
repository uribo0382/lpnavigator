import React, { useState } from 'react';
import { Plus, Edit, Trash, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { mockFormulas } from '../../../utils/mockData';
import FormulaEditor from './FormulaEditor';

const BasicInfoFormula: React.FC = () => {
  const [formulas, setFormulas] = useState(
    mockFormulas.filter(formula => formula.type === 'basic_info')
  );
  const [showModal, setShowModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [formulaToActivate, setFormulaToActivate] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingFormula(null);
    setShowModal(true);
  };

  const handleEdit = (formula: any) => {
    setEditingFormula(formula);
    setShowModal(true);
  };

  const handleSave = (formula: any) => {
    if (editingFormula) {
      // 編集モード
      const isActivatingInEdit = !editingFormula.isActive && formula.isActive;
      
      if (isActivatingInEdit && formulas.some(f => f.id !== formula.id && f.isActive)) {
        // 他に有効なフォーミュラがある状態で有効化しようとしている場合
        setFormulaToActivate(formula.id);
        setShowActivateConfirm(true);
        return;
      }
      
      setFormulas(formulas.map(f => 
        f.id === formula.id ? formula : f
      ));
    } else {
      // 新規作成モード
      const newFormula = {
        ...formula,
        id: `formula-${Date.now()}`,
        type: 'basic_info',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 新規フォーミュラを有効化する場合、他の有効なフォーミュラがあるかチェック
      if (newFormula.isActive && formulas.some(f => f.isActive)) {
        newFormula.id = `formula-${Date.now()}`; // IDを設定
        setFormulaToActivate(newFormula.id);
        setFormulas([...formulas, {...newFormula, isActive: false}]); // 一旦無効状態で追加
        setShowActivateConfirm(true);
        return;
      }
      
      setFormulas([...formulas, newFormula]);
    }
    setShowModal(false);
  };

  const confirmDelete = (id: string) => {
    setFormulaToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (formulaToDelete) {
      setFormulas(formulas.filter(f => f.id !== formulaToDelete));
    }
    setShowDeleteConfirm(false);
    setFormulaToDelete(null);
  };

  const confirmActivate = (id: string) => {
    // 既に他のフォーミュラが有効な場合は確認モーダルを表示
    if (formulas.some(f => f.isActive && f.id !== id)) {
      setFormulaToActivate(id);
      setShowActivateConfirm(true);
    } else {
      // 他に有効なフォーミュラがなければ直接切り替え
      toggleActive(id);
    }
  };

  const handleActivateConfirm = () => {
    if (formulaToActivate) {
      // 全てのフォーミュラを無効化してから指定されたフォーミュラだけを有効化
      setFormulas(formulas.map(f => ({
        ...f,
        isActive: f.id === formulaToActivate
      })));
    }
    setShowActivateConfirm(false);
    setFormulaToActivate(null);
    setShowModal(false); // 編集モーダルも閉じる
  };

  const toggleActive = (id: string) => {
    const formula = formulas.find(f => f.id === id);
    
    if (formula && !formula.isActive) {
      // 有効化する場合は他のすべてのフォーミュラを無効化
      setFormulas(formulas.map(f => ({
        ...f,
        isActive: f.id === id
      })));
    } else if (formula && formula.isActive) {
      // 現在有効なフォーミュラを無効化
      setFormulas(formulas.map(f => 
        f.id === id ? { ...f, isActive: false } : f
      ));
    }
  };

  // 有効なフォーミュラの数をカウント
  const activeFormulasCount = formulas.filter(f => f.isActive).length;

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">基本情報フォーミュラ管理</h1>
        <Button
          variant="primary"
          onClick={handleCreateNew}
          leftIcon={<Plus size={16} />}
        >
          新規作成
        </Button>
      </div>

      {activeFormulasCount === 0 && (
        <div className="mb-4 p-3 bg-warning-50 border border-warning-200 text-warning-700 rounded-md flex items-start">
          <AlertCircle size={18} className="mr-2 mt-0.5" />
          <div>
            <p className="font-medium">有効なフォーミュラがありません</p>
            <p className="text-sm">基本情報の生成には有効なフォーミュラが必要です。フォーミュラを有効化してください。</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {formulas.length === 0 ? (
          <Card>
            <div className="p-4 text-center text-gray-500">
              登録されている基本情報フォーミュラはありません
            </div>
          </Card>
        ) : (
          formulas.map(formula => (
            <Card key={formula.id} className="overflow-hidden">
              <div className="p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <h3 className="font-medium text-gray-900">{formula.name}</h3>
                  {formula.summary && (
                    <p className="text-sm text-gray-500 mt-1">{formula.summary}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">状態:</span>
                    {formula.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700">
                        <CheckCircle size={14} className="mr-1" /> 有効
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <XCircle size={14} className="mr-1" /> 無効
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmActivate(formula.id)}
                    disabled={formula.isActive}
                  >
                    {formula.isActive ? '有効' : '有効にする'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(formula)}
                    leftIcon={<Edit size={14} />}
                  >
                    編集
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => confirmDelete(formula.id)}
                    leftIcon={<Trash size={14} />}
                    disabled={formula.isActive && activeFormulasCount === 1}
                  >
                    削除
                  </Button>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-1">テンプレート:</div>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
                    {formula.template}
                  </pre>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 編集・作成モーダル */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFormula ? "基本情報フォーミュラを編集" : "新規基本情報フォーミュラを作成"}
        size="lg"
      >
        <FormulaEditor
          formula={editingFormula}
          formulaType="basic_info"
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="フォーミュラの削除"
        size="sm"
      >
        <div className="p-4">
          <p className="mb-4">このフォーミュラを削除してもよろしいですか？</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              削除する
            </Button>
          </div>
        </div>
      </Modal>

      {/* 有効化確認モーダル */}
      <Modal
        isOpen={showActivateConfirm}
        onClose={() => setShowActivateConfirm(false)}
        title="フォーミュラの有効化"
        size="sm"
      >
        <div className="p-4">
          <p className="mb-4">基本情報フォーミュラは1つだけ有効にできます。このフォーミュラを有効にすると、他のフォーミュラは自動的に無効になります。よろしいですか？</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowActivateConfirm(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              onClick={handleActivateConfirm}
            >
              有効にする
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BasicInfoFormula; 