import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { UserIcon, EditIcon, DeleteIcon, PlusIcon } from './Icons';

interface LoginScreenProps {
  operators: string[];
  setOperators: React.Dispatch<React.SetStateAction<string[]>>;
  onLogin: (user: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ operators, setOperators, onLogin }) => {
  const [selectedOperator, setSelectedOperator] = useState<string>(operators[0] || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<string | null>(null);
  const [newOperatorName, setNewOperatorName] = useState('');
  const newOperatorInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOperator) {
      onLogin(selectedOperator);
    }
  };

  const handleAddOperator = () => {
    if (newOperatorName.trim() && !operators.includes(newOperatorName.trim())) {
      setOperators(prev => [...prev, newOperatorName.trim()].sort());
      setNewOperatorName('');
    }
  };
  
  const handleEditOperator = () => {
     if (editingOperator && newOperatorName.trim() && !operators.includes(newOperatorName.trim())) {
        setOperators(prev => prev.map(op => op === editingOperator ? newOperatorName.trim() : op).sort());
        setNewOperatorName('');
        setEditingOperator(null);
     }
  };

  const handleDeleteOperator = (operator: string) => {
    setOperators(prev => prev.filter(op => op !== operator));
    if (selectedOperator === operator) {
        setSelectedOperator(operators.filter(op => op !== operator)[0] || '');
    }
  };

  const startEditing = (operator: string) => {
    setEditingOperator(operator);
    setNewOperatorName(operator);
    setTimeout(() => newOperatorInputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setEditingOperator(null);
    setNewOperatorName('');
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-100 mb-8">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="operator-select" className="block mb-2 text-sm font-medium text-slate-400">
              Seleccione Operador
            </label>
            <select
              id="operator-select"
              value={selectedOperator}
              onChange={e => setSelectedOperator(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
              disabled={operators.length === 0}
            >
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedOperator}
            className="w-full text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            Ingresar
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            Gestionar Operadores
          </button>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Operadores">
        <div className="space-y-4">
            <form onSubmit={(e) => {
                e.preventDefault();
                if (editingOperator) {
                    handleEditOperator();
                } else {
                    handleAddOperator();
                }
            }}>
                <div className="flex gap-2">
                    <input
                        ref={newOperatorInputRef}
                        type="text"
                        value={newOperatorName}
                        onChange={(e) => setNewOperatorName(e.target.value)}
                        placeholder={editingOperator ? "Editar nombre..." : "Nuevo operador..."}
                        className="flex-grow bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                    />
                    {editingOperator ? (
                        <>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Guardar</button>
                            <button type="button" onClick={cancelEditing} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                        </>
                    ) : (
                        <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white p-2.5 rounded-lg transition-colors"><PlusIcon className="w-5 h-5"/></button>
                    )}
                </div>
            </form>
            <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {operators.map(op => (
                    <li key={op} className="flex items-center justify-between bg-slate-700 p-2 rounded-lg">
                        <span className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-slate-400"/>
                            {op}
                        </span>
                        <div className="space-x-2">
                            <button onClick={() => startEditing(op)} className="text-slate-400 hover:text-cyan-400 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDeleteOperator(op)} className="text-slate-400 hover:text-red-500 p-1"><DeleteIcon className="w-5 h-5"/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </Modal>
    </div>
  );
};

export default LoginScreen;