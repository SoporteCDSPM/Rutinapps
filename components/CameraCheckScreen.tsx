import React, { useState, useEffect } from 'react';
import { CameraCheckRecord, DeviceState, Server, DeviceStatus, Camera } from '../types';
import Modal from './Modal';
import { HelpIcon, SaveIcon, CommentIcon, ServerIcon, CameraIcon } from './Icons';

interface CameraCheckScreenProps {
  servers: Server[];
  helpText: string;
  currentUser: string;
  addCheckRecord: (record: Omit<CameraCheckRecord, 'id' | 'date'>) => void;
}

const CameraCheckScreen: React.FC<CameraCheckScreenProps> = ({ servers, helpText, currentUser, addCheckRecord }) => {
  const [cameraStates, setCameraStates] = useState<Record<string, DeviceState>>({});
  const [serverStates, setServerStates] = useState<Record<string, boolean>>({});
  const [generalObservations, setGeneralObservations] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [observationOpenFor, setObservationOpenFor] = useState<string | null>(null);

  const allCameras = React.useMemo(() => servers.flatMap(s => s.cameras), [servers]);

  const initializeStates = () => {
    const initialCameraState: Record<string, DeviceState> = {};
    allCameras.forEach(cam => {
      initialCameraState[cam.id] = { status: DeviceStatus.NotChecked, observation: '' };
    });
    setCameraStates(initialCameraState);

    const initialServerState: Record<string, boolean> = {};
    servers.forEach(server => {
      initialServerState[server.id] = false;
    });
    setServerStates(initialServerState);
  };

  useEffect(() => {
    initializeStates();
  }, [servers]); // Re-initialize if servers change

  const handleStatusChange = (camId: string, status: DeviceStatus) => {
    setCameraStates(prev => ({
      ...prev,
      [camId]: { ...prev[camId], status: prev[camId].status === status ? DeviceStatus.NotChecked : status },
    }));
  };

  const handleServerCheck = (serverId: string) => {
    setServerStates(prev => ({ ...prev, [serverId]: !prev[serverId] }));
  };

  const handleObservationChange = (camId: string, value: string) => {
    setCameraStates(prev => ({ ...prev, [camId]: { ...prev[camId], observation: value } }));
  };

  const handleToggleObservation = (camId: string) => {
    setObservationOpenFor(prev => (prev === camId ? null : camId));
  };

  const handleToggleAll = () => {
    const allCurrentlyOk = servers.every(s => serverStates[s.id]) && allCameras.every(cam => cameraStates[cam.id]?.status === DeviceStatus.OK);
    
    const newCameraStates: Record<string, DeviceState> = {};
    allCameras.forEach(cam => {
      newCameraStates[cam.id] = { ...(cameraStates[cam.id]), status: allCurrentlyOk ? DeviceStatus.NotChecked : DeviceStatus.OK };
    });
    setCameraStates(newCameraStates);

    const newServerStates: Record<string, boolean> = {};
    servers.forEach(server => {
      newServerStates[server.id] = !allCurrentlyOk;
    });
    setServerStates(newServerStates);
  };
  
  const handleSave = () => {
      addCheckRecord({
          operator: currentUser,
          generalObservations,
          cameraStates,
          serverStates,
      });
      // Reset form
      initializeStates();
      setGeneralObservations('');
      setObservationOpenFor(null);

      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 3000);
  };

  const allSelected = servers.length > 0 && servers.every(s => serverStates[s.id]) && allCameras.length > 0 && allCameras.every(cam => cameraStates[cam.id]?.status === DeviceStatus.OK);

  const StatusSelector: React.FC<{ camId: string; currentStatus: DeviceStatus }> = ({ camId, currentStatus }) => {
    const statuses = [
      { status: DeviceStatus.OK, label: 'OK', color: 'bg-slate-600', hover: 'hover:bg-green-600', active: 'bg-green-500 text-white' },
      { status: DeviceStatus.NoConnection, label: 'SC', color: 'bg-slate-600', hover: 'hover:bg-yellow-500', active: 'bg-yellow-500 text-white' },
      { status: DeviceStatus.InRepair, label: 'ER', color: 'bg-slate-600', hover: 'hover:bg-red-600', active: 'bg-red-600 text-white' },
    ];
    return (
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg">
        {statuses.map(({ status, label, color, hover, active }) => (
          <button key={status} onClick={() => handleStatusChange(camId, status)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors w-12 ${currentStatus === status ? active : `${color} text-slate-300 ${hover}`}`}>
            {label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Chequeo Diario de Cámaras</h2>
            
            <div className="mb-6 bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-slate-200">Servidores y Cámaras a Revisar</h3>
                    <button onClick={handleToggleAll} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                        {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos como OK'}
                    </button>
                </div>
                <div className="text-xs text-slate-400 mb-4 flex justify-end gap-4 font-mono pr-1">
                    <span>SC: Sin Conexión</span>
                    <span>ER: En Reparación</span>
                </div>
                <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-4">
                    {servers.map(server => (
                        <div key={server.id}>
                            <div className="flex items-center gap-3 font-semibold text-slate-300 mb-2 p-2 bg-slate-900/40 rounded-md">
                                <input type="checkbox" id={`server-${server.id}`} checked={serverStates[server.id] || false} onChange={() => handleServerCheck(server.id)} className="w-5 h-5 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-600 focus:ring-2"/>
                                <label htmlFor={`server-${server.id}`} className="flex items-center gap-2 cursor-pointer"><ServerIcon className="w-5 h-5 text-cyan-500" /><span>{server.ip}</span></label>
                            </div>
                            <ul className="flex flex-col gap-3 pl-7">
                                {server.cameras.map(camera => (
                                    <li key={camera.id} className="bg-slate-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <CameraIcon className="w-4 h-4 text-slate-400"/>
                                                <span className="font-semibold">{camera.location}</span>
                                                <span className="font-mono text-xs text-slate-400">({camera.ip})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatusSelector camId={camera.id} currentStatus={cameraStates[camera.id]?.status} />
                                                <button onClick={() => handleToggleObservation(camera.id)} title="Añadir observación" className={`p-2 rounded-md transition-colors ${observationOpenFor === camera.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}>
                                                    <CommentIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        {observationOpenFor === camera.id && (
                                            <div className="mt-3 mx-2 animate-[fadeIn_0.3s_ease-out]">
                                                <textarea value={cameraStates[camera.id]?.observation || ''} onChange={(e) => handleObservationChange(camera.id, e.target.value)} rows={2} className="w-full bg-slate-600 border border-slate-500 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5" placeholder={`Observación para ${camera.location}...`}/>
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {server.cameras.length === 0 && <li className="text-xs text-slate-500 italic">No hay cámaras configuradas para este servidor.</li>}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="observations" className="block mb-2 text-xl font-semibold text-slate-200">Observaciones Generales</label>
                <textarea id="observations" rows={3} value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5" placeholder="Añada cualquier observación relevante..."/>
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaveSuccess} className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-base px-8 py-3 text-center transition-all flex items-center justify-center gap-2 disabled:bg-green-600 disabled:cursor-not-allowed">
                    <SaveIcon className="w-5 h-5"/>
                    {isSaveSuccess ? '¡Chequeo Guardado!' : 'Guardar Chequeo'}
                </button>
            </div>
        </div>

        <button onClick={() => setIsHelpModalOpen(true)} className="fixed bottom-6 right-6 bg-slate-700 text-cyan-400 p-4 rounded-full shadow-lg hover:bg-slate-600 hover:text-cyan-300 transition-all transform hover:scale-110" aria-label="Ayuda">
            <HelpIcon className="w-8 h-8"/>
        </button>

        <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Procedimiento de Ayuda">
            <div className="text-slate-300 whitespace-pre-wrap">{helpText}</div>
        </Modal>
    </div>
  );
};

export default CameraCheckScreen;