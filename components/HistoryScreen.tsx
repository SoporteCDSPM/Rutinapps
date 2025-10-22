
import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// FIX: Removed 'Device' import and updated logic to use the current data model.
import { CheckRecord, Server, DeviceStatus, Camera } from '../types';
import Modal from './Modal';
import { PdfIcon, ChevronDownIcon, CheckCircleIcon, CloseCircleIcon, CommentIcon, ServerIcon } from './Icons';

interface HistoryScreenProps {
  records: CheckRecord[];
  operators: string[];
  servers: Server[];
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ records, operators, servers }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [selectedObservation, setSelectedObservation] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // FIX: Updated logic to use the new Server data structure (ip, cameras) instead of the old one (name, devices).
  const { cameraMap, serverMap } = useMemo(() => {
    const cMap = new Map<string, Camera>();
    const sMap = new Map<string, Server>();
    servers.forEach(server => {
      (server.cameras || []).forEach(camera => {
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
    });
  }, [records, filterDate, filterOperator]);
  
  const handleToggleExpand = (recordId: string) => {
    setExpandedRecordId(prev => (prev === recordId ? null : recordId));
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    doc.text("Historial de Chequeos de Cámaras", 14, 16);

    const body: any[] = [];
    
    filteredRecords.forEach(record => {
      // Main row for the record
      body.push([
        { content: new Date(record.date).toLocaleString('es-ES'), styles: { fontStyle: 'bold' } },
        { content: record.operator, styles: { fontStyle: 'bold' } },
        { content: record.generalObservations || 'N/A', styles: { fontStyle: 'bold' } }
      ]);

      // Sub-header for details
      body.push([
        { content: 'Cámara', styles: { fillColor: [71, 85, 105], textColor: 240 } },
        { content: 'Estado', styles: { fillColor: [71, 85, 105], textColor: 240 } },
        { content: 'Observación Específica', styles: { fillColor: [71, 85, 105], textColor: 240 } }
      ]);
      
      // Device details rows
      // FIX: Property 'deviceStates' does not exist on type 'CheckRecord'. Use cameraStates.
      const cameraIds = Object.keys(record.cameraStates);
      if (cameraIds.length > 0) {
        cameraIds.forEach(camId => {
          const state = record.cameraStates[camId];
          const camera = cameraMap.get(camId);
          const cameraLabel = camera ? `${camera.location} (${camera.ip})` : camId;
          body.push([
            cameraLabel,
            // FIX: Property 'status' does not exist on type 'unknown'. Check status from the typed state object.
            state.status === DeviceStatus.OK ? 'OK' : 'No OK',
            // FIX: Property 'observation' does not exist on type 'unknown'. Check observation from the typed state object.
            state.observation || 'N/A'
          ]);
        });
      } else {
        body.push([{ content: 'No se registraron equipos para este chequeo.', colSpan: 3, styles: { halign: 'center' } }]);
      }
      
      // Spacer row
      body.push([{ content: '', colSpan: 3, styles: { fillColor: [30, 41, 59] } }]);
    });


    autoTable(doc, {
        head: [["Fecha y Hora", "Operador", "Observaciones Generales"]],
        body: body,
        startY: 20,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }, // slate-800
        didDrawCell: (data) => {
            // Remove the main header for the detail rows
            if (data.row.raw.length === 3 && data.row.raw[0].content === 'Cámara') {
                 if (data.cell.section === 'head') {
                    // This is a bit of a hack to prevent drawing the main header over the sub-header
                    return false;
                 }
            }
        }
    });
    
    doc.save(`historial-chequeos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // FIX: Replace `JSX.Element` with `React.ReactElement` to resolve "Cannot find namespace 'JSX'" error.
  const renderRecordDetails = (record: CheckRecord): React.ReactElement => {
    const detailsByServer: Record<string, React.ReactElement[]> = {};

    // FIX: Property 'deviceStates' does not exist on type 'CheckRecord'. Use cameraStates.
    Object.entries(record.cameraStates).forEach(([camId, state]) => {
      // FIX: Use serverMap and server.ip based on the new data model.
      const serverInfo = serverMap.get(camId);
      const serverName = serverInfo?.ip || 'Servidor Desconocido';
      if (!detailsByServer[serverName]) {
        detailsByServer[serverName] = [];
      }
      const camera = cameraMap.get(camId);
      const cameraLabel = camera ? `${camera.location} (${camera.ip})` : camId;
      detailsByServer[serverName].push(
        <tr key={camId} className="bg-slate-800 text-sm">
          <td className="py-2 px-4 pl-8 font-mono">{cameraLabel}</td>
          <td className="py-2 px-4">
            {/* FIX: Property 'status' does not exist on type 'unknown'. Access from typed state. */}
            {state.status === DeviceStatus.OK ? 
              <span className="flex items-center gap-2 text-green-400"><CheckCircleIcon className="w-4 h-4"/> OK</span> : 
              <span className="flex items-center gap-2 text-red-400"><CloseCircleIcon className="w-4 h-4"/> No OK</span>
            }
          </td>
          <td className="py-2 px-4 text-slate-400 italic">
            {/* FIX: Property 'observation' does not exist on type 'unknown'. Access from typed state. */}
            {state.observation || 'Sin observación'}
          </td>
        </tr>
      );
    });

    return (
        <tr className="bg-slate-900/50">
            <td colSpan={4} className="p-0">
                <div className="p-4 animate-[fadeIn_0.3s_ease-out]">
                    <h4 className="font-semibold text-slate-100 mb-2">Detalle del Chequeo:</h4>
                    {Object.entries(detailsByServer).map(([serverName, details]) => (
                        <div key={serverName} className="mb-4">
                            <h5 className="flex items-center gap-2 font-bold text-slate-300 bg-slate-700 p-2 rounded-t-md"><ServerIcon className="w-5 h-5"/>{serverName}</h5>
                            <table className="w-full">
                                <tbody>
                                    {details}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </td>
        </tr>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100 mb-4 sm:mb-0">Historial de Chequeos</h2>
                <button 
                  onClick={handleGeneratePdf}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 transition-colors disabled:bg-slate-600"
                  disabled={filteredRecords.length === 0}
                  title={filteredRecords.length === 0 ? "No hay datos para generar el PDF" : "Generar PDF del historial filtrado"}
                >
                  <PdfIcon className="w-5 h-5"/>
                  <span>Generar PDF</span>
                </button>
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
                                <th scope="col" className="py-3 px-6">Observaciones Generales</th>
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
                                        <td className="py-4 px-6 max-w-md truncate" title={record.generalObservations}>
                                            {record.generalObservations || 'Sin observaciones'}
                                        </td>
                                    </tr>
                                    {expandedRecordId === record.id && renderRecordDetails(record)}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-slate-400">
                                        No se encontraron registros con los filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        {selectedObservation !== null && (
            <Modal isOpen={true} onClose={() => setSelectedObservation(null)} title="Observación Completa">
                <div className="text-slate-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto bg-slate-900/50 p-4 rounded-lg">
                    {selectedObservation}
                </div>
            </Modal>
        )}
    </div>
  );
};

export default HistoryScreen;