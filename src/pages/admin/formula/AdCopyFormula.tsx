import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { formulaService } from '../../../services/formulaService';
import FormulaEditor from './FormulaEditor';

const AdCopyFormula: React.FC = () => {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーミュラデータを取得
  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await formulaService.getFormulasByType('ad_copy');
      setFormulas(data);
    } catch (err) {
      console.error('Error fetching formulas:', err);
      setError('フォーミュラの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingFormula(null);
    setShowModal(true);
  };

  const handleEdit = (formula: any) => {
    setEditingFormula(formula);
    setShowModal(true);
  };

  const handleSave = async (formula: any) => {
    try {
      setError(null);
      
      if (editingFormula) {
        // 編集モード
        await formulaService.updateFormula(formula.id, formula);
      } else {
        // 新規作成モード
        const newFormula = {
          ...formula,
          type: 'ad_copy',
          is_active: formula.isActive || false
        };
        await formulaService.createFormula(newFormula);
      }
      
      setShowModal(false);
      await fetchFormulas(); // データを再取得
    } catch (err) {
      console.error('Error saving formula:', err);
      setError('フォーミュラの保存に失敗しました。');
    }
  };

  const confirmDelete = (id: string) => {
    setFormulaToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (formulaToDelete) {
      try {
        setError(null);
        await formulaService.deleteFormula(formulaToDelete);
        await fetchFormulas(); // データを再取得
      } catch (err) {
        console.error('Error deleting formula:', err);
        setError('フォーミュラの削除に失敗しました。');
      }
    }
    setShowDeleteConfirm(false);
    setFormulaToDelete(null);
  };

  const toggleActive = async (id: string) => {
    try {
      setError(null);
      await formulaService.toggleActive(id);
      await fetchFormulas(); // データを再取得
    } catch (err) {
      console.error('Error toggling formula active state:', err);
      setError('状態の切り替えに失敗しました。');
    }
  };

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">広告文フォーミュラ管理</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={fetchFormulas}
            leftIcon={<RefreshCw size={16} />}
            isLoading={isLoading}
          >
            更新
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateNew}
            leftIcon={<Plus size={16} />}
          >
            新規作成
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
              <p className="text-gray-500">読み込み中...</p>
            </div>
          </Card>
        ) : formulas.length === 0 ? (
          <Card>
            <div className="p-4 text-center text-gray-500">
              登録されている広告文フォーミュラはありません
            </div>
          </Card>
        ) : (
          formulas.map(formula => (
            <Card key={formula.id} className="overflow-hidden">
              <div className="p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-7">
                  <h3 className="font-medium text-gray-900">{formula.name}</h3>
                  {formula.summary && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formula.summary}
                    </p>
                  )}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center">
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
        title={editingFormula ? "広告文フォーミュラを編集" : "新規広告文フォーミュラを作成"}
        size="lg"
      >
        <FormulaEditor
          formula={editingFormula}
          formulaType="ad_copy"
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

export default AdCopyFormula; 