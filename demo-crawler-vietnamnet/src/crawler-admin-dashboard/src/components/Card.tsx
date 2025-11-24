import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleIcon?: React.ReactNode;
  titleRightAccessory?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleIcon, titleRightAccessory }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
                {titleIcon}
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            {titleRightAccessory}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default Card;