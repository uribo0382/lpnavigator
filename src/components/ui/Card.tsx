import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  headerAction?: React.ReactNode;
  contentClassName?: string;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '', 
  headerAction,
  contentClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {headerAction && (
            <div className="flex items-center">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={`p-4 md:p-6 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card; 