import React, { useState, useMemo, useEffect } from 'react';
import { JornadaCheckRecord, Shift, JornadaTask, Screen } from '../types';
import { MORNING_TASKS, AFTERNOON_TASKS } from './jornada-tasks';
import { SaveIcon, CameraIcon } from './Icons';

interface JornadaCheckScreenProps {
  currentUser: string;
  addJornadaCheckRecord: (record: Omit<JornadaCheckRecord, 'id' | 'date'>) => void;
  editingRecord: JornadaCheckRecord | null;
  updateJornadaCheckRecord: (record: JornadaCheckRecord) => void;
  onCancelEdit: () => void;
  onNavigate: (screen: Screen) => void;
}

const JornadaCheckScreen: React.FC<JornadaCheckScreenProps> = ({ 
    currentUser, 
    addJornadaCheckRecord,
    editingRecord,
    updateJornadaCheckRecord,
    onCancelEdit,
    onNavigate,
}) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [observations, setObservations] = useState('');
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  
  useEffect(() => {
    if (editingRecord) {
        setSelectedShift(editingRecord.shift);
        setCompletedTasks(new Set(editingRecord.completedTasks));
        setObservations(editingRecord.observations);
    }
  }, [editingRecord]);


  const today = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.

  const tasksForShift = useMemo(() => {
    if (selectedShift === 'Mañana') return MORNING_TASKS;
    if (selectedShift === 'Tarde') return AFTERNOON_TASKS;
    return [];
  }, [selectedShift]);

  const applicableTasks = useMemo(() => {
    return tasksForShift.filter(task => !task.days || task.days.includes(today));
  }, [tasksForShift, today]);


  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const allApplicableTasksCompleted = useMemo(() => {
    return applicableTasks.length > 0 && applicableTasks.every(task => completedTasks.has(task.id));
  }, [applicableTasks, completedTasks]);

  const handleSelectAll = () => {
    const applicableTaskIds = new Set(applicableTasks.map(t => t.id));
    if (allApplicableTasksCompleted) {
      // If all are selected, deselect them
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        applicableTaskIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // If not all (or none) are selected, select all of them
      setCompletedTasks(prev => new Set([...prev, ...applicableTaskIds]));
    }
  };
  
  const handleSave = () => {
    if (!selectedShift) return;

    if (editingRecord) {
        updateJornadaCheckRecord({
            ...editingRecord,
            shift: selectedShift,
            completedTasks: Array.from(completedTasks),
            observations,
        });
        onCancelEdit(); // This will navigate back to history
    } else {
        addJornadaCheckRecord({
            operator: currentUser,
            shift: selectedShift,
            completedTasks: Array.from(completedTasks),
            observations,
        });
        // Reset form
        setSelectedShift(null);
        setCompletedTasks(new Set());
        setObservations('');
    }

    setIsSaveSuccess(true);
    setTimeout(() => setIsSaveSuccess(false), 3000);
  };
  
  const handleReset = () => {
      if(editingRecord) {
        onCancelEdit();
      } else {
        setSelectedShift(null);
        setCompletedTasks(new Set());
        setObservations('');
      }
  }

  const isCameraTask = (task: JornadaTask) => task.id === 'm-cam' || task.id === 'a-cam';

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <h2 className="text-3xl font-bold mb-6 text-slate-100">
                {editingRecord ? 'Editando Chequeo de Jornada' : 'Chequeo de Rutinas de Jornada'}
            </h2>
            
            {!selectedShift ? (
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-200 mb-6">Seleccione su jornada para comenzar</h3>
                    <div className="flex justify-center gap-8">
                        <button onClick={() => setSelectedShift('Mañana')} className="text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-800 font-medium rounded-lg text-lg px-12 py-6 text-center transition-colors">
                            Jornada de Mañana
                        </button>
                        <button onClick={() => setSelectedShift('Tarde')} className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-800 font-medium rounded-lg text-lg px-12 py-6 text-center transition-colors">
                            Jornada de Tarde
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-slate-200">
                            Tareas - Jornada de <span className={selectedShift === 'Mañana' ? 'text-sky-400' : 'text-indigo-400'}>{selectedShift}</span>
                        </h3>
                        <button onClick={handleReset} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                            {editingRecord ? 'Cancelar Edición' : 'Cambiar Jornada'}
                        </button>
                    </div>

                    <div className="mb-6 bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-end items-center mb-4">
                            <button onClick={handleSelectAll} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed" disabled={applicableTasks.length === 0}>
                                {allApplicableTasksCompleted ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                            </button>
                        </div>
                        <ul className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {tasksForShift.map(task => {
                                const isTaskForToday = !task.days || task.days.includes(today);
                                return (
                                    <li key={task.id}>
                                        <div className={`flex items-center justify-between bg-slate-700 rounded-lg p-4 transition-colors ${
                                            isTaskForToday ? '' : 'opacity-50'
                                        }`}>
                                            <label className={`flex items-center ${isTaskForToday ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={completedTasks.has(task.id)}
                                                    onChange={() => handleToggleTask(task.id)}
                                                    disabled={!isTaskForToday}
                                                    className="w-6 h-6 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                                <span className={`ml-4 text-base ${
                                                    completedTasks.has(task.id) && isTaskForToday ? 'text-slate-100 line-through' : 'text-slate-300'
                                                } ${!isTaskForToday ? 'text-slate-500' : ''}`}>
                                                    {task.text}
                                                    {task.days && !isTaskForToday && <span className="text-xs text-slate-500 ml-2 italic">(No aplica hoy)</span>}
                                                </span>
                                            </label>
                                            {isCameraTask(task) && (
                                                <button onClick={() => onNavigate(Screen.CameraCheck)} className="text-xs bg-cyan-800 text-cyan-200 hover:bg-cyan-700 px-3 py-1 rounded-md flex items-center gap-2">
                                                    <CameraIcon className="w-4 h-4"/>
                                                    Ir a Chequeo
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="observations" className="block mb-2 text-xl font-semibold text-slate-200">
                            Observaciones
                        </label>
                        <textarea
                            id="observations"
                            rows={3}
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                            placeholder="Añada cualquier observación o incidencia..."
                        />
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaveSuccess}
                            className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-base px-8 py-3 text-center transition-all flex items-center justify-center gap-2 disabled:bg-green-600 disabled:cursor-not-allowed"
                        >
                            <SaveIcon className="w-5 h-5"/>
                            {isSaveSuccess ? '¡Guardado!' : (editingRecord ? 'Actualizar Chequeo' : 'Guardar Chequeo')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default JornadaCheckScreen;