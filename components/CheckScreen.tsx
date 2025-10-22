
import React, { useState, useEffect } from 'react';
// FIX: Import DeviceStatus to handle device state correctly.
import { CheckRecord, DeviceState, Server, DeviceStatus } from '../types';
import Modal from './Modal';
import { HelpIcon, SaveIcon, CommentIcon, ServerIcon } from './Icons';

interface CheckScreenProps {
  servers: Server[];
  helpText: string;
  currentUser: string;
  addCheckRecord: (record: Omit<CheckRecord, 'id' | 'date'>) => void;
}

const CheckScreen: React.FC<CheckScreenProps> = ({ servers, helpText, currentUser, addCheckRecord }) => {
  const [deviceStates, setDeviceStates] = useState<Record<string, DeviceState>>({});
  // FIX: Add serverStates to match the CheckRecord type.
  const [serverStates, setServerStates] = useState<Record<string, boolean>>({});
  const [generalObservations, setGeneralObservations] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [observationOpenFor, setObservationOpenFor] = useState<string | null>(null);

  const allDeviceIps = React.useMemo(() => servers.flatMap(s => s.devices.map(d => d.ip)), [servers]);

  useEffect(() => {
    const initialState: Record<string, DeviceState> = {};
    allDeviceIps.forEach(ip => {
      // FIX: 'checked' does not exist in type 'DeviceState'. Initialize with 'status'.
      initialState[ip] = { status: DeviceStatus.NotChecked, observation: '' };
    });
    setDeviceStates(initialState);
    
    // FIX: Initialize serverStates.
    const initialServerState: Record<string, boolean> = {};
    servers.forEach(server => {
        initialServerState[server.id] = false;
    });
    setServerStates(initialServerState);
  }, [allDeviceIps, servers]);

  const handleToggleCheck = (ip: string) => {
    setDeviceStates(prev => ({
      ...prev,
      // FIX: Property 'checked' does not exist on type 'DeviceState'. Toggle status instead.
      [ip]: { ...prev[ip], status: prev[ip].status === DeviceStatus.OK ? DeviceStatus.NotChecked : DeviceStatus.OK },
    }));
  };

  const handleObservationChange = (ip: string, value: string) => {
    setDeviceStates(prev => ({
        ...prev,
        [ip]: { ...prev[ip], observation: value }
    }));
  };

  const handleToggleObservation = (ip: string) => {
    setObservationOpenFor(prev => (prev === ip ? null : ip));
  };

  const handleToggleAll = () => {
    // FIX: Property 'checked' does not exist on type 'DeviceState'. Check status instead.
    const allCurrentlyChecked = allDeviceIps.length > 0 && allDeviceIps.every(ip => deviceStates[ip]?.status === DeviceStatus.OK);
    const newStates: Record<string, DeviceState> = {};
    allDeviceIps.forEach(ip => {
        // FIX: 'checked' does not exist in type 'DeviceState'. Assign 'status' instead.
        newStates[ip] = { ...(deviceStates[ip] || { observation: '', status: DeviceStatus.NotChecked }), status: !allCurrentlyChecked ? DeviceStatus.OK : DeviceStatus.NotChecked };
    });
    setDeviceStates(newStates);
  };
  
  const handleSave = () => {
      // FIX: Property 'serverStates' is missing in the argument.
      addCheckRecord({
          operator: currentUser,
          generalObservations,
          deviceStates,
          serverStates,
      });
      // Reset form
      const resetState: Record<string, DeviceState> = {};
      allDeviceIps.forEach(ip => {
          // FIX: 'checked' does not exist in type 'DeviceState'. Reset 'status'.
          resetState[ip] = { status: DeviceStatus.NotChecked, observation: '' };
      });
      setDeviceStates(resetState);

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

  // FIX: Property 'checked' does not exist on type 'DeviceState'. Check status instead.
  const allChecked = allDeviceIps.length > 0 && allDeviceIps.every(ip => deviceStates[ip]?.status === DeviceStatus.OK);

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
                                {server.name}
                            </h4>
                            <ul className="flex flex-col gap-3 pl-7">
                                {server.devices.map(device => (
                                    <li key={device.ip} className="bg-slate-700 rounded-lg p-3 transition-all duration-300 ease-in-out">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center p-2 rounded-lg cursor-pointer flex-grow">
                                            <input
                                                type="checkbox"
                                                // FIX: Property 'checked' does not exist on type 'DeviceState'. Check status instead.
                                                checked={deviceStates[device.ip]?.status === DeviceStatus.OK || false}
                                                onChange={() => handleToggleCheck(device.ip)}
                                                className="w-5 h-5 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-600 focus:ring-2"
                                            />
                                            {/* FIX: Property 'checked' does not exist on type 'DeviceState'. Use status for styling. */}
                                            <span className={`ml-4 font-mono text-sm ${deviceStates[device.ip]?.status === DeviceStatus.OK ? 'text-slate-100' : 'text-slate-300'}`}>{device.ip}</span>
                                        </label>
                                        <button 
                                            onClick={() => handleToggleObservation(device.ip)}
                                            title="Añadir observación"
                                            className={`p-2 rounded-md transition-colors ${observationOpenFor === device.ip ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                                        >
                                        <CommentIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {observationOpenFor === device.ip && (
                                        <div className="mt-3 mx-2 animate-[fadeIn_0.3s_ease-out]">
                                            <textarea
                                                value={deviceStates[device.ip]?.observation || ''}
                                                onChange={(e) => handleObservationChange(device.ip, e.target.value)}
                                                rows={2}
                                                className="w-full bg-slate-600 border border-slate-500 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                                placeholder={`Observación para ${device.ip}...`}
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
