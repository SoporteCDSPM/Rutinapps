
import React, { useState, useMemo } from 'react';
import { CameraCheckRecord, Server, DeviceStatus, Camera } from '../types';
import { ChevronDownIcon, CheckCircleIcon, CloseCircleIcon, ServerIcon, CameraIcon } from './Icons';

interface CameraHistoryScreenProps {
  records: CameraCheckRecord[];
  operators: string[];
  servers: Server[];
}

const CameraHistoryScreen: React.FC<CameraHistoryScreenProps> = ({ records, operators, servers }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const { cameraMap, serverMap } = useMemo(() => {
    const cMap = new Map<string, Camera>();
    const sMap = new Map<string, Server>();
    servers.forEach(server => {
      server.cameras.forEach(camera => {
        cMap.set(camera.id, camera);
        sMap.set(camera.id, server);
      });
    });
    return { cameraMap: cMap, serverMap: sMap };
  }, [servers]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const isDateMatch = !filterDate || recordDate.toISOString().startsWith(filterDate);
      const isOperatorMatch = !filterOperator || record.operator === filterOperator;
      return isDateMatch && isOperatorMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, filterDate, filterOperator]);
  
  const handleToggleExpand = (recordId: string) => {
    setExpandedRecordId(prev => (prev === recordId ? null : recordId));
  };

  const getStatusBadge = (status: DeviceStatus | undefined) => {
    switch (status) {
        case DeviceStatus.OK:
            return <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircleIcon className="w-4 h-4"/> OK</span>;
        case DeviceStatus.NoConnection:
            return <span className="flex items-center gap-1 text-yellow-400 text-xs"><CloseCircleIcon className="w-4 h-4"/> SC</span>;
        case DeviceStatus.InRepair:
            return <span className="flex items-center gap-1 text-red-400 text-xs"><CloseCircleIcon className="w-4 h-4"/> ER</span>;
        default:
            return <span className="flex items-center gap-1 text-slate-500 text-xs"><CloseCircleIcon className="w-4 h-4"/> No Rev.</span>;
    }
  };

  const renderRecordDetails = (record: CameraCheckRecord): React.ReactElement => {
    const detailsByServer: Record<string, React.ReactElement[]> = {};

    Object.entries(record.cameraStates).forEach(([cameraId, state]) => {
      const serverInfo = serverMap.get(cameraId);
      if (!serverInfo) return; // Camera or server might have been deleted

      const serverIp = serverInfo.ip;
      const camera = cameraMap.get(cameraId);
      if (!camera) return;

      if (!detailsByServer[serverIp]) {
        detailsByServer[serverIp] = [];
      }
      
      detailsByServer[serverIp].push(
        <tr key={cameraId} className="bg-slate-800 text-sm">
          <td className="py-2 px-4 pl-8"><CameraIcon className="w-4 h-4 inline-block mr-2 text-slate-400"/>{camera.location} ({camera.ip})</td>
          <td className="py-2 px-4">{getStatusBadge(state?.status)}</td>
          <td className="py-2 px-4 text-slate-400 italic">{state?.observation || 'Sin observación'}</td>
        </tr>
      );
    });

    return (
        <tr className="bg-slate-900/50">
            <td colSpan={4} className="p-0">
                <div className="p-4 animate-[fadeIn_0.3s_ease-out]">
                    <h4 className="font-semibold text-slate-100 mb-2">Detalle del Chequeo:</h4>
                    {Object.keys(detailsByServer).length > 0 ? Object.entries(detailsByServer).map(([serverIp, cameraRows]) => {
                        const serverId = serverMap.get(
                           Object.keys(record.cameraStates).find(id => serverMap.get(id)?.ip === serverIp) || ''
                        )?.id;
                        const isServerOk = !!(serverId && record.serverStates?.[serverId]);
                        return (
                            <div key={serverIp} className="mb-4">
                                <h5 className="flex items-center gap-2 font-bold text-slate-300 bg-slate-700 p-2 rounded-t-md">
                                    <span title={isServerOk ? "Servidor chequeado OK" : "Servidor no chequeado"}>
                                        {isServerOk ? <CheckCircleIcon className="w-5 h-5 text-green-400"/> : <CloseCircleIcon className="w-5 h-5 text-slate-500"/> }
                                    </span>
                                    <ServerIcon className="w-5 h-5"/> {serverIp}
                                </h5>
                                <table className="w-full"><tbody>{cameraRows}</tbody></table>
                            </div>
                        )
                    }) : <p className="text-slate-500 italic">No se encontraron detalles de cámaras para este registro.</p>}
                </div>
            </td>
        </tr>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Historial de Chequeos de Cámaras</h2>
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
                    <button onClick={() => { setFilterDate(''); setFilterOperator(''); }} className="w-full text-white bg-slate-600 hover:bg-slate-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">Limpiar Filtros</button>
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
                                <th scope="col" className="py-3 px-6">Observaciones Generales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? filteredRecords.map(record => (
                                <React.Fragment key={record.id}>
                                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => handleToggleExpand(record.id)}>
                                        <td className="py-4 px-6 text-center"><ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`} /></td>
                                        <td className="py-4 px-6 font-medium whitespace-nowrap">{new Date(record.date).toLocaleString('es-ES')}</td>
                                        <td className="py-4 px-6">{record.operator}</td>
                                        <td className="py-4 px-6 max-w-md truncate" title={record.generalObservations}>{record.generalObservations || 'Sin observaciones'}</td>
                                    </tr>
                                    {expandedRecordId === record.id && renderRecordDetails(record)}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-slate-400">No se encontraron registros.</td>
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

export default CameraHistoryScreen;