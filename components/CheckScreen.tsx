

import React, { useState, useEffect } from 'react';
// FIX: Import DeviceStatus and Camera to handle device state correctly.
import { CheckRecord, DeviceState, Server, DeviceStatus, Camera } from '../types';
import Modal from './Modal';
import { HelpIcon, SaveIcon, CommentIcon, ServerIcon } from './Icons';

interface CheckScreenProps {
  servers: Server[];
  helpText: string;
  currentUser: string;
  addCheckRecord: (record: Omit<CheckRecord, 'id' | 'date'>) => void;
}

const CheckScreen: React.FC<CheckScreenProps> = ({ servers, helpText, currentUser, addCheckRecord }) => {
  // FIX: Rename deviceStates to cameraStates to match the CheckRecord type.
  const [cameraStates, setCameraStates] = useState<Record<string, DeviceState>>({});
  const [serverStates, setServerStates] = useState<Record<string, boolean>>({});
  const [generalObservations, setGeneralObservations] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [observationOpenFor, setObservationOpenFor] = useState<string | null>(null);

  // FIX: Use server.cameras and camera.id instead of server.devices and device.ip.
  const allCameraIds = React.useMemo(() => servers.flatMap(s => s.cameras.map(c => c.id)), [servers]);

  useEffect(() => {
    const initialState: Record<string, DeviceState> = {};
    // FIX: Initialize state using camera IDs.
    allCameraIds.forEach(camId => {
      initialState[camId] = { status: DeviceStatus.NotChecked, observation: '' };
    });
    setCameraStates(initialState);
    
    const initialServerState: Record<string, boolean> = {};
    servers.forEach(server => {
        initialServerState[server.id] = false;
    });
    setServerStates(initialServerState);
  }, [allCameraIds, servers]);

  // FIX: Update handler to use camera ID.
  const handleToggleCheck = (camId: string) => {
    setCameraStates(prev => ({
      ...prev,
      [camId]: { ...prev[camId], status: prev[camId].status === DeviceStatus.OK ? DeviceStatus.NotChecked : DeviceStatus.OK },
    }));
  };

  // FIX: Update handler to use camera ID.
  const handleObservationChange = (camId: string, value: string) => {
    setCameraStates(prev => ({
        ...prev,
        [camId]: { ...prev[camId], observation: value }
    }));
  };

  // FIX: Update handler to use camera ID.
  const handleToggleObservation = (camId: string) => {
    setObservationOpenFor(prev => (prev === camId ? null : camId));
  };

  const handleToggleAll = () => {
    // FIX: Check status based on cameraStates and camera IDs.
    const allCurrentlyChecked = allCameraIds.length > 0 && allCameraIds.every(camId => cameraStates[camId]?.status === DeviceStatus.OK);
    const newStates: Record<string, DeviceState> = {};
    allCameraIds.forEach(camId => {
        newStates[camId] = { ...(cameraStates[camId] || { observation: '', status: DeviceStatus.NotChecked }), status: !allCurrentlyChecked ? DeviceStatus.OK : DeviceStatus.NotChecked };
    });
    setCameraStates(newStates);
  };
  
  const handleSave = () => {
      // FIX: Use 'cameraStates' property instead of 'deviceStates'.
      addCheckRecord({
          operator: currentUser,
          generalObservations,
          cameraStates,
          serverStates,
      });
      // Reset form
      const resetState: Record<string, DeviceState> = {};
      // FIX: Reset state using camera IDs.
      allCameraIds.forEach(camId => {
          resetState[camId] = { status: DeviceStatus.NotChecked, observation: '' };
      });
      setCameraStates(resetState);

      const resetServerState: Record<string, boolean> = {};
      servers.forEach(server => {
        resetServerState[server.id] = false;
      });
      setServerStates(resetServerState);

      setGeneralObservations('');
      setObservationOpenFor(null);

      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 3000);
  };

  // FIX: Check status based on cameraStates and camera IDs.
  const allChecked = allCameraIds.length > 0 && allCameraIds.every(camId => cameraStates[camId]?.status === DeviceStatus.OK);

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-700">
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Chequeo Diario de Grabación</h2>
            
            <div className="mb-6 bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-200">Equipos a Revisar</h3>
                    <button onClick={handleToggleAll} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                        {allChecked ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                    </button>
                </div>
                <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-4">
                    {servers.map(server => (
                        <div key={server.id}>
                            <h4 className="flex items-center gap-2 font-semibold text-slate-300 mb-2">
                                <ServerIcon className="w-5 h-5 text-cyan-500" />
                                {/* FIX: Property 'name' does not exist on type 'Server'. Use 'ip'. */}
                                {server.ip}
                            </h4>
                            <ul className="flex flex-col gap-3 pl-7">
                                {/* FIX: Property 'devices' does not exist on type 'Server'. Use 'cameras'. */}
                                {server.cameras.map(camera => (
                                    <li key={camera.id} className="bg-slate-700 rounded-lg p-3 transition-all duration-300 ease-in-out">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center p-2 rounded-lg cursor-pointer flex-grow">
                                            <input
                                                type="checkbox"
                                                // FIX: Use camera ID to check status in cameraStates.
                                                checked={cameraStates[camera.id]?.status === DeviceStatus.OK || false}
                                                onChange={() => handleToggleCheck(camera.id)}
                                                className="w-5 h-5 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-600 focus:ring-2"
                                            />
                                            {/* FIX: Use camera states and display camera location and IP. */}
                                            <span className={`ml-4 font-mono text-sm ${cameraStates[camera.id]?.status === DeviceStatus.OK ? 'text-slate-100' : 'text-slate-300'}`}>{camera.location} ({camera.ip})</span>
                                        </label>
                                        <button 
                                            onClick={() => handleToggleObservation(camera.id)}
                                            title="Añadir observación"
                                            className={`p-2 rounded-md transition-colors ${observationOpenFor === camera.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                                        >
                                        <CommentIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {observationOpenFor === camera.id && (
                                        <div className="mt-3 mx-2 animate-[fadeIn_0.3s_ease-out]">
                                            <textarea
                                                value={cameraStates[camera.id]?.observation || ''}
                                                onChange={(e) => handleObservationChange(camera.id, e.target.value)}
                                                rows={2}
                                                className="w-full bg-slate-600 border border-slate-500 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                                placeholder={`Observación para ${camera.location}...`}
                                                />
                                        </div>
                                    )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="observations" className="block mb-2 text-xl font-semibold text-slate-200">
                    Observaciones Generales
                </label>
                <textarea
                    id="observations"
                    rows={3}
                    value={generalObservations}
                    onChange={e => setGeneralObservations(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    placeholder="Añada cualquier observación relevante sobre el chequeo..."
                />
            </div>
            
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaveSuccess}
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-base px-8 py-3 text-center transition-all flex items-center justify-center gap-2 disabled:bg-green-600 disabled:cursor-not-allowed"
                >
                    <SaveIcon className="w-5 h-5"/>
                    {isSaveSuccess ? '¡Chequeo Guardado!' : 'Guardar Chequeo'}
                </button>
            </div>
        </div>

        <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="fixed bottom-6 right-6 bg-slate-700 text-cyan-400 p-4 rounded-full shadow-lg hover:bg-slate-600 hover:text-cyan-300 transition-all transform hover:scale-110"
            aria-label="Ayuda"
        >
            <HelpIcon className="w-8 h-8"/>
        </button>

        <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Procedimiento de Ayuda">
            <div className="text-slate-300 whitespace-pre-wrap">
                {helpText}
            </div>
        </Modal>
    </div>
  );
};

export default CheckScreen;