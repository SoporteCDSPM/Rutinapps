import React, { useState, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Modal from './Modal';
// FIX: Add 'CloseIcon' to the import list to resolve a 'Cannot find name' error.
import { DeleteIcon, PlusIcon, SaveIcon, EditIcon, ServerIcon, UploadIcon, DownloadIcon, CameraIcon, SpinnerIcon, CloseIcon } from './Icons';
import { Server, Camera } from '../types';

interface CameraAdminScreenProps {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  helpText: string;
  setHelpText: (text: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ServerModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: (ip: string) => void,
}> = ({ isOpen, onClose, onSave }) => {
    const [ip, setIp] = useState('');

    const handleSave = () => {
        if (ip.trim()) {
            onSave(ip.trim());
            setIp('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Servidor (DVR/NVR)">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="server-ip" className="block mb-2 text-sm font-medium text-slate-400">IP del Servidor</label>
                        <input id="server-ip" type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Ej: 192.168.1.100" className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"/>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">Guardar Servidor</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

const CameraManagerModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    server: Server,
    onSaveCameras: (cameras: Camera[]) => void
}> = ({isOpen, onClose, server, onSaveCameras}) => {
    const [cameras, setCameras] = useState<Camera[]>(server.cameras);
    const [editingCamera, setEditingCamera] = useState<Partial<Camera>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    
    React.useEffect(() => {
        setCameras(server.cameras);
        setEditingId(null);
        setEditingCamera({});
    }, [server, isOpen]);

    const handleSaveEditing = () => {
        if (!editingId || !editingCamera.ip) return;
        if (editingId === 'new') {
            const newCam: Camera = { id: `cam_${Date.now()}`, ...editingCamera } as Camera;
            setCameras(prev => [...prev, newCam]);
        } else {
            setCameras(prev => prev.map(c => c.id === editingId ? { ...c, ...editingCamera } as Camera : c));
        }
        setEditingId(null);
        setEditingCamera({});
    };

    const handleStartEdit = (camera: Camera) => {
        setEditingId(camera.id);
        setEditingCamera(camera);
    };

    const handleStartNew = () => {
        setEditingId('new');
        setEditingCamera({ city: '', section: '', number: '', location: '', ip: '' });
    };

    const handleDelete = (id: string) => {
        setCameras(prev => prev.filter(c => c.id !== id));
    };

    const handleSaveAndClose = () => {
        onSaveCameras(cameras);
        onClose();
    };

    const renderEditForm = () => (
        <div className="grid grid-cols-6 gap-2 items-center p-2 bg-slate-700 rounded-lg">
            <input value={editingCamera.city || ''} onChange={e => setEditingCamera(p => ({...p, city: e.target.value}))} placeholder="Ciudad" className="col-span-1 bg-slate-600 text-xs p-1 rounded"/>
            <input value={editingCamera.section || ''} onChange={e => setEditingCamera(p => ({...p, section: e.target.value}))} placeholder="Sección" className="col-span-1 bg-slate-600 text-xs p-1 rounded"/>
            <input value={editingCamera.number || ''} onChange={e => setEditingCamera(p => ({...p, number: e.target.value}))} placeholder="N°" className="col-span-1 bg-slate-600 text-xs p-1 rounded"/>
            <input value={editingCamera.location || ''} onChange={e => setEditingCamera(p => ({...p, location: e.target.value}))} placeholder="Ubicación" className="col-span-1 bg-slate-600 text-xs p-1 rounded"/>
            <input value={editingCamera.ip || ''} onChange={e => setEditingCamera(p => ({...p, ip: e.target.value}))} placeholder="IP" className="col-span-1 bg-slate-600 text-xs p-1 rounded"/>
            <div className="col-span-1 flex gap-1">
                <button onClick={handleSaveEditing} className="p-1 bg-green-600 rounded"><SaveIcon className="w-4 h-4"/></button>
                <button onClick={() => setEditingId(null)} className="p-1 bg-slate-500 rounded"><CloseIcon className="w-4 h-4"/></button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Cámaras de ${server.ip}`}>
            <div className="space-y-4">
                <button onClick={handleStartNew} disabled={!!editingId} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm disabled:bg-slate-600">
                    <PlusIcon className="w-5 h-5"/> Añadir Manualmente
                </button>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2 bg-slate-900/50 p-2 rounded-md">
                   {editingId === 'new' && renderEditForm()}
                   {cameras.map(cam => (
                       editingId === cam.id ? renderEditForm() :
                       <div key={cam.id} className="grid grid-cols-6 gap-2 items-center p-2 bg-slate-700 rounded-lg text-xs">
                           <span className="truncate" title={cam.city}>{cam.city}</span>
                           <span className="truncate" title={cam.section}>{cam.section}</span>
                           <span className="truncate" title={cam.number}>{cam.number}</span>
                           <span className="truncate" title={cam.location}>{cam.location}</span>
                           <span className="font-mono" title={cam.ip}>{cam.ip}</span>
                           <div className="flex gap-1 justify-end">
                               <button onClick={() => handleStartEdit(cam)} className="p-1 text-slate-400 hover:text-cyan-400"><EditIcon className="w-4 h-4"/></button>
                               <button onClick={() => handleDelete(cam.id)} className="p-1 text-slate-400 hover:text-red-500"><DeleteIcon className="w-4 h-4"/></button>
                           </div>
                       </div>
                   ))}
                   {cameras.length === 0 && !editingId && <div className="text-center text-slate-500 text-sm p-4">No hay cámaras añadidas.</div>}
                </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSaveAndClose} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">Guardar Cambios</button>
                </div>
            </div>
        </Modal>
    )
}

const CameraAdminScreen: React.FC<CameraAdminScreenProps> = ({ servers, setServers, helpText, setHelpText, onExport, onImport }) => {
  const [localHelpText, setLocalHelpText] = useState(helpText);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [managingCamerasFor, setManagingCamerasFor] = useState<Server | null>(null);
  const [uploadingToServer, setUploadingToServer] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddServer = (ip: string) => {
    if (servers.some(s => s.ip === ip)) {
        alert("Ya existe un servidor con esa IP.");
        return;
    }
    const newServer: Server = {
        id: `server_${Date.now()}`,
        ip,
        cameras: []
    };
    setServers(prev => [...prev, newServer]);
  };

  const handleDeleteServer = (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este servidor y todas sus cámaras?")) {
        setServers(prev => prev.filter(s => s.id !== id));
    }
  };
  
  const handleSaveHelpText = () => {
      setHelpText(localHelpText);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };
  
  const handleTriggerImport = () => {
    setIsImportModalOpen(false);
    importInputRef.current?.click();
  };

  const handleTriggerImageUpload = (server: Server) => {
      setUploadingToServer(server);
      imageInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingToServer) return;
    
    setIsLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const base64Data = await blobToBase64(file);

        const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
        const textPart = { text: `Extrae todos los detalles de las cámaras de la imagen. Cada línea de cámara sigue el patrón 'Ciudad Sección Número Ubicación(IP)'. Convierte cada línea detectada en un objeto JSON. Proporciona un único array JSON como salida. Cada objeto debe tener: "city", "section", "number", "location", y "ip". Ejemplo: 'PMontt Taller 02 Guardia Salida(192.168.202.12)' se convierte en {"city": "PMontt", "section": "Taller", "number": "02", "location": "Guardia Salida", "ip": "192.168.202.12"}. Extrae la IP de los paréntesis. Ignora texto irrelevante. Si falta información en una línea, usa 'N/A'. El resultado DEBE ser un array JSON válido, incluso si está vacío.` };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const parsedCameras = JSON.parse(jsonText) as Omit<Camera, 'id'>[];

        const newCameras: Camera[] = parsedCameras.map(cam => ({
            ...cam,
            id: `cam_${Date.now()}_${Math.random()}`
        }));
        
        handleSaveCameras(uploadingToServer.id, [...uploadingToServer.cameras, ...newCameras]);

    } catch (error) {
        console.error("Error processing image with Gemini:", error);
        alert("No se pudo procesar la imagen. Verifique el formato y el contenido del texto en la imagen.");
    } finally {
        setIsLoading(false);
        setUploadingToServer(null);
        e.target.value = '';
    }
  };

  const handleSaveCameras = (serverId: string, cameras: Camera[]) => {
      setServers(prev => prev.map(s => s.id === serverId ? {...s, cameras} : s));
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700 lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-100">Gestionar Servidores y Cámaras</h2>
            <button onClick={() => setIsServerModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm"><PlusIcon className="w-5 h-5"/>Añadir Servidor</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
          {servers.map(server => (
            <div key={server.id} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <ServerIcon className="w-6 h-6 text-cyan-400"/>
                        <h3 className="font-bold text-lg text-slate-100 font-mono">{server.ip}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => handleTriggerImageUpload(server)} disabled={isLoading && uploadingToServer?.id === server.id} className="text-sm bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-1 rounded-md flex items-center gap-2 disabled:bg-slate-600">
                           {isLoading && uploadingToServer?.id === server.id ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <UploadIcon className="w-4 h-4"/>}
                           <span>Subir Imagen</span>
                        </button>
                        <button onClick={() => handleDeleteServer(server.id)} className="text-slate-400 hover:text-red-500 p-1" title="Eliminar servidor"><DeleteIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="pl-9 space-y-2">
                    <button onClick={() => setManagingCamerasFor(server)} className="text-xs bg-cyan-800 text-cyan-200 hover:bg-cyan-700 px-3 py-1 rounded-md flex items-center gap-2">
                        <CameraIcon className="w-4 h-4"/>
                        Gestionar Cámaras ({server.cameras.length})
                    </button>
                    {server.cameras.length > 0 ? (
                        <ul className="pl-4 border-l-2 border-slate-600 space-y-1 max-h-40 overflow-y-auto">
                            {server.cameras.map(camera => (
                                <li key={camera.id} className="text-xs text-slate-400 flex items-center gap-2 p-1 rounded hover:bg-slate-600/50">
                                    <span className="font-semibold text-slate-300 w-2/5 truncate" title={camera.location}>{camera.location}</span>
                                    <span className="font-mono text-cyan-400 w-3/5 truncate" title={camera.ip}>{camera.ip}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="pl-4 text-xs text-slate-500 italic">No hay cámaras asignadas.</p>
                    )}
                </div>
            </div>
          ))}
           {servers.length === 0 && <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-lg">No hay servidores configurados.</div>}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-slate-100">Procedimiento de Ayuda</h2>
            <textarea value={localHelpText} onChange={e => setLocalHelpText(e.target.value)} rows={8} className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 flex-grow" placeholder="Escriba aquí las instrucciones..."/>
            <button onClick={handleSaveHelpText} className="mt-4 w-full text-white bg-cyan-600 hover:bg-cyan-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
                <SaveIcon className="w-5 h-5"/>
                {saveStatus === 'saved' ? '¡Guardado!' : 'Guardar Texto'}
            </button>
        </div>
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-slate-100">Gestión de Datos</h2>
            <div className="flex flex-col gap-4">
                <button onClick={onExport} className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2"><DownloadIcon className="w-5 h-5"/>Exportar Datos</button>
                <button onClick={() => setIsImportModalOpen(true)} className="w-full text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2"><UploadIcon className="w-5 h-5"/>Importar Datos</button>
                <input type="file" accept=".json" ref={importInputRef} onChange={onImport} className="hidden" />
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
            </div>
        </div>
      </div>
      <ServerModal isOpen={isServerModalOpen} onClose={() => setIsServerModalOpen(false)} onSave={handleAddServer} />
      {managingCamerasFor && (
          <CameraManagerModal 
            isOpen={!!managingCamerasFor}
            onClose={() => setManagingCamerasFor(null)}
            server={managingCamerasFor}
            onSaveCameras={(cameras) => handleSaveCameras(managingCamerasFor.id, cameras)}
          />
      )}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Confirmar Importación">
          <div className="text-slate-300">
              <p className="mb-4"><strong>¡Atención!</strong> Está a punto de reemplazar todos los datos actuales con el contenido del archivo.</p>
              <div className="flex justify-end gap-4 mt-6">
                  <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg">Cancelar</button>
                  <button onClick={handleTriggerImport} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">Sí, importar</button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
export default CameraAdminScreen;