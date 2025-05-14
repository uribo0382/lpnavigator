import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BasicInfoFormula from './BasicInfoFormula';
import AdCopyFormula from './AdCopyFormula';
import LpArticleFormula from './LpArticleFormula';

const FormulaManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="basic-info" replace />} />
      <Route path="basic-info" element={<BasicInfoFormula />} />
      <Route path="ad-copy" element={<AdCopyFormula />} />
      <Route path="lp-article" element={<LpArticleFormula />} />
    </Routes>
  );
};

export default FormulaManagement; 