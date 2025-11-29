import React from 'react';

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-2.5 px-5 rounded-lg shadow-lg flex items-center animate-fade-in-up z-50">
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 text-xl font-bold opacity-70 hover:opacity-100">&times;</button>
        </div>
    );
};

export default Toast;