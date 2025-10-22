import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { DeleteIcon, PlusIcon, SaveIcon, UploadIcon, DownloadIcon, EditIcon, ServerIcon, PdfIcon } from './Icons';
// FIX: Removed unused 'Device' import which was causing an error.
import { Server } from '../types';

interface AdminScreenProps {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  helpText: string;
  setHelpText: (text: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// FIX: Refactored ServerModal to align with the current Server type, which uses 'ip' instead of 'name' and manages cameras instead of a list of devices.
const ServerModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (server: Server) => void,
    existingServer: Server | null
}> = ({ isOpen, onClose, onSave, existingServer }) => {
    const [ip, setIp] = useState('');

    React.useEffect(() => {
        if (existingServer) {
            setIp(existingServer.ip);
        } else {
            setIp('');
        }
    }, [existingServer, isOpen]);


    const handleSave = () => {
        if (ip.trim()) {
            const serverToSave: Server = {
                id: existingServer?.id || `server_${Date.now()}`,
                ip: ip.trim(),
                cameras: existingServer?.cameras || [],
            };
            onSave(serverToSave);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingServer ? 'Editar Servidor' : 'Añadir Servidor'}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="server-ip" className="block mb-2 text-sm font-medium text-slate-400">IP del Servidor</label>
                    <input
                        id="server-ip"
                        type="text"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        placeholder="Ej: 192.168.200.213"
                        className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">Guardar Servidor</button>
                </div>
            </div>
        </Modal>
    );
};


const AdminScreen: React.FC<AdminScreenProps> = ({ servers, setServers, helpText, setHelpText, onExport, onImport }) => {
  const [localHelpText, setLocalHelpText] = useState(helpText);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleSaveServer = (server: Server) => {
    setServers(prev => {
        const existing = prev.find(s => s.id === server.id);
        if(existing) {
            return prev.map(s => s.id === server.id ? server : s);
        }
        return [...prev, server];
    });
  };

  const handleDeleteServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
  };
  
  const handleOpenServerModal = (server: Server | null) => {
    setEditingServer(server);
    setIsServerModalOpen(true);
  }

  const handleSaveHelpText = () => {
      setHelpText(localHelpText);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  }

  const handleTriggerImport = () => {
    setIsImportModalOpen(false);
    importInputRef.current?.click();
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Server Management */}
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700 lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-100">Gestionar Servidores</h2>
            <button onClick={() => handleOpenServerModal(null)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <PlusIcon className="w-5 h-5"/>
                Añadir Servidor
            </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
          {servers.map(server => (
            <div key={server.id} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <ServerIcon className="w-6 h-6 text-cyan-400"/>
                        {/* FIX: The Server type uses 'ip', not 'name'. */}
                        <h3 className="font-bold text-lg text-slate-100 font-mono">{server.ip}</h3>
                    </div>
                    <div className="space-x-2">
                        <button onClick={() => handleOpenServerModal(server)} className="text-slate-400 hover:text-cyan-400 p-1"><EditIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteServer(server.id)} className="text-slate-400 hover:text-red-500 p-1"><DeleteIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                {/* FIX: The Server type has 'cameras', not 'devices'. This component doesn't manage cameras, so we'll just show the count. */}
                <div className="pl-9">
                    <p className="text-sm text-slate-400">{server.cameras.length} cámaras asignadas.</p>
                </div>
            </div>
          ))}
           {servers.length === 0 && <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-lg">No hay servidores configurados.</div>}
        </div>
      </div>

      {/* Help & Data Management */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-slate-100">Procedimiento de Ayuda</h2>
            <p className="text-sm text-slate-400 mb-4">
                Este texto se mostrará a los operadores si necesitan ayuda.
            </p>
            <textarea
            value={localHelpText}
            onChange={e => setLocalHelpText(e.target.value)}
            rows={8}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 flex-grow"
            placeholder="Escriba aquí las instrucciones..."
            />
            <button onClick={handleSaveHelpText} className="mt-4 w-full text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors flex items-center justify-center gap-2">
                <SaveIcon className="w-5 h-5"/>
                {saveStatus === 'saved' ? '¡Guardado!' : 'Guardar Texto'}
            </button>
        </div>

        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-slate-100">Gestión de Datos</h2>
            <p className="text-sm text-slate-400 mb-6">
                Exporte o importe todos los datos de la aplicación.
            </p>
            <div className="flex flex-col gap-4">
                <button 
                    onClick={onExport}
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors flex items-center justify-center gap-2"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    Exportar Datos
                </button>
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors flex items-center justify-center gap-2"
                >
                    <UploadIcon className="w-5 h-5"/>
                    Importar Datos
                </button>
                <input type="file" accept=".json" ref={importInputRef} onChange={onImport} className="hidden" />
            </div>
        </div>
      </div>
        
      <ServerModal isOpen={isServerModalOpen} onClose={() => setIsServerModalOpen(false)} onSave={handleSaveServer} existingServer={editingServer} />

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Confirmar Importación">
          <div className="text-slate-300">
              <p className="mb-4">
                  <strong>¡Atención!</strong> Está a punto de reemplazar todos los datos actuales con el contenido del archivo que seleccione.
              </p>
              <p>
                  Esta acción no se puede deshacer. ¿Está seguro de que desea continuar?
              </p>
              <div className="flex justify-end gap-4 mt-6">
                  <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors">
                      Cancelar
                  </button>
                  <button onClick={handleTriggerImport} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                      Sí, importar datos
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default AdminScreen;