import React, { useState } from 'react';
import { Plus, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { mockFormulas } from '../../../utils/mockData';
import FormulaEditor from './FormulaEditor';

const LpArticleFormula: React.FC = () => {
  const [formulas, setFormulas] = useState(
    mockFormulas.filter(formula => formula.type === 'lp_article')
  );
  const [showModal, setShowModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);

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
      setFormulas(formulas.map(f => 
        f.id === formula.id ? formula : f
      ));
    } else {
      // 新規作成モード
      const newFormula = {
        ...formula,
        id: `formula-${Date.now()}`,
        type: 'lp_article',
        createdAt: new Date(),
        updatedAt: new Date()
      };
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

  const toggleActive = (id: string) => {
    setFormulas(formulas.map(f => 
      f.id === id ? { ...f, isActive: !f.isActive } : f
    ));
  };

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">LP記事フォーミュラ管理</h1>
        <Button
          variant="primary"
          onClick={handleCreateNew}
          leftIcon={<Plus size={16} />}
        >
          新規作成
        </Button>
      </div>

      <div className="space-y-4">
        {formulas.length === 0 ? (
          <Card>
            <div className="p-4 text-center text-gray-500">
              登録されているLP記事フォーミュラはありません
            </div>
          </Card>
        ) : (
          formulas.map(formula => (
            <Card key={formula.id} className="overflow-hidden">
              <div className="p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <h3 className="font-medium text-gray-900">{formula.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    変数: {formula.variables.join(', ')}
                  </p>
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
                    onClick={() => toggleActive(formula.id)}
                  >
                    {formula.isActive ? '無効にする' : '有効にする'}
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
        title={editingFormula ? "LP記事フォーミュラを編集" : "新規LP記事フォーミュラを作成"}
        size="lg"
      >
        <FormulaEditor
          formula={editingFormula}
          formulaType="lp_article"
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
    </div>
  );
};

export default LpArticleFormula; 