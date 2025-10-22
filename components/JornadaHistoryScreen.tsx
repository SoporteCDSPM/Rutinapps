import React, { useState, useMemo } from 'react';
import { JornadaCheckRecord } from '../types';
import { MORNING_TASKS, AFTERNOON_TASKS } from './jornada-tasks';
import { ChevronDownIcon, CheckCircleIcon } from './Icons';

interface JornadaHistoryScreenProps {
  records: JornadaCheckRecord[];
  operators: string[];
}

const allTasks = [...MORNING_TASKS, ...AFTERNOON_TASKS];
const taskMap = new Map(allTasks.map(task => [task.id, task.text]));

const JornadaHistoryScreen: React.FC<JornadaHistoryScreenProps> = ({ records, operators }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const isDateMatch = !filterDate || recordDate.toISOString().startsWith(filterDate);
      const isOperatorMatch = !filterOperator || record.operator === filterOperator;
      return isDateMatch && isOperatorMatch;
    });
  }, [records, filterDate, filterOperator]);

  const handleToggleExpand = (recordId: string) => {
    setExpandedRecordId(prev => (prev === recordId ? null : recordId));
  };
  
  const renderRecordDetails = (record: JornadaCheckRecord): React.ReactElement => (
    <tr className="bg-slate-900/50">
        <td colSpan={5} className="p-0">
            <div className="p-4 animate-[fadeIn_0.3s_ease-out] grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-slate-100 mb-2">Tareas Completadas:</h4>
                    {record.completedTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {record.completedTasks.map(taskId => (
                                <li key={taskId} className="flex items-center gap-2 text-slate-300 text-sm">
                                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span>{taskMap.get(taskId) || 'Tarea desconocida'}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 italic text-sm">No se marcaron tareas.</p>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-100 mb-2">Observaciones:</h4>
                    <p className="text-slate-300 whitespace-pre-wrap bg-slate-800 p-3 rounded-md text-sm">
                        {record.observations || 'Sin observaciones.'}
                    </p>
                </div>
            </div>
        </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100 mb-4 sm:mb-0">Historial de Chequeos de Jornada</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-700/50 p-4 rounded-lg">
                <div>
                    <label htmlFor="date-filter" className="block mb-2 text-sm font-medium text-slate-400">Filtrar por Fecha</label>
                    <input type="date" id="date-filter" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" />
                </div>
                <div>
                    <label htmlFor="operator-filter" className="block mb-2 text-sm font-medium text-slate-400">Filtrar por Operador</label>
                    <select id="operator-filter" value={filterOperator} onChange={e => setFilterOperator(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5">
                        <option value="">Todos los Operadores</option>
                        {operators.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={() => { setFilterDate(''); setFilterOperator(''); }} className="w-full text-white bg-slate-600 hover:bg-slate-500 focus:ring-4 focus:outline-none focus:ring-slate-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto relative shadow-md rounded-lg">
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-200 uppercase bg-slate-700 sticky top-0">
                            <tr>
                                <th scope="col" className="py-3 px-6 w-12"></th>
                                <th scope="col" className="py-3 px-6">Fecha y Hora</th>
                                <th scope="col" className="py-3 px-6">Operador</th>
                                <th scope="col" className="py-3 px-6">Jornada</th>
                                <th scope="col" className="py-3 px-6">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? filteredRecords.map(record => (
                                <React.Fragment key={record.id}>
                                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => handleToggleExpand(record.id)}>
                                        <td className="py-4 px-6 text-center">
                                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`} />
                                        </td>
                                        <td className="py-4 px-6 font-medium whitespace-nowrap">
                                            {new Date(record.date).toLocaleString('es-ES')}
                                        </td>
                                        <td className="py-4 px-6">{record.operator}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.shift === 'Mañana' ? 'bg-sky-900 text-sky-300' : 'bg-indigo-900 text-indigo-300'}`}>
                                                {record.shift}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 max-w-sm truncate" title={record.observations}>
                                            {record.observations || 'N/A'}
                                        </td>
                                    </tr>
                                    {expandedRecordId === record.id && renderRecordDetails(record)}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        No se encontraron registros con los filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default JornadaHistoryScreen;