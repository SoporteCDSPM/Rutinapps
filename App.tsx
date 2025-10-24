import React, { useState, useEffect } from 'react';
import { Screen, CameraCheckRecord, Server, JornadaCheckRecord, ExportData } from './types';
import * as DB from './services/db';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import CameraCheckScreen from './components/CameraCheckScreen';
import CameraHistoryScreen from './components/CameraHistoryScreen';
import CameraAdminScreen from './components/CameraAdminScreen';
import JornadaCheckScreen from './components/JornadaCheckScreen';
import JornadaHistoryScreen from './components/JornadaHistoryScreen';
import Header from './components/Header';
import { AppIcon, SpinnerIcon } from './components/Icons';

const App: React.FC = () => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Login);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // App state, mirrors the data in the database
  const [operators, setOperators] = useState<string[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [helpText, setHelpText] = useState<string>('');
  const [cameraHistory, setCameraHistory] = useState<CameraCheckRecord[]>([]);
  const [jornadaHistory, setJornadaHistory] = useState<JornadaCheckRecord[]>([]);
  const [editingJornadaRecord, setEditingJornadaRecord] = useState<JornadaCheckRecord | null>(null);

  const loadDataFromDb = () => {
    setOperators(DB.getOperators());
    setServers(DB.getServers());
    setHelpText(DB.getHelpText());
    setCameraHistory(DB.getCameraHistory());
    setJornadaHistory(DB.getJornadaHistory());
  };

  // Initialize DB on first render
  useEffect(() => {
    const init = async () => {
        await DB.initDb();
        loadDataFromDb();

        // Set default data only if DB is empty after potential migration
        if (DB.getOperators().length === 0) {
            const defaultOperators = ['Operador A', 'Operador B'];
            DB.setOperators(defaultOperators);
            setOperators(defaultOperators);
        }
        if (DB.getServers().length === 0) {
            const defaultServers = [
                { id: 'server-1', ip: '192.168.200.213', cameras: [] },
                { id: 'server-2', ip: '192.168.200.214', cameras: [] }
            ];
            DB.setServers(defaultServers);
            setServers(defaultServers);
        }
        if (DB.getHelpText() === '') {
            const defaultHelp = 'Procedimiento de ejemplo: Si una cámara no graba, reinicie el servidor correspondiente. Si el problema persiste, contacte al soporte técnico en el anexo 555.';
            DB.setHelpText(defaultHelp);
            setHelpText(defaultHelp);
        }
        await DB.saveDb();
        setDbLoaded(true);
    };
    init();
  }, []);

  const handleLogin = (user: string) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.Main);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen(Screen.Login);
  };
  
  // --- Data update functions ---
  // These functions update both the DB and the component state

  const handleSetOperators = (action: React.SetStateAction<string[]>) => {
    const newOperators = typeof action === 'function' ? action(operators) : action;
    DB.setOperators(newOperators);
    setOperators(newOperators);
    DB.saveDb();
  };

  const handleSetServers = (action: React.SetStateAction<Server[]>) => {
    const newServers = typeof action === 'function' ? action(servers) : action;
    DB.setServers(newServers);
    setServers(newServers);
    DB.saveDb();
  };

  const handleSetHelpText = (text: string) => {
    DB.setHelpText(text);
    setHelpText(text);
    DB.saveDb();
  };

  const addCameraCheckRecord = (record: Omit<CameraCheckRecord, 'id' | 'date'>) => {
    const newRecord = DB.addCameraCheckRecord(record);
    if (newRecord) {
      setCameraHistory(prev => [newRecord, ...prev]);
      DB.saveDb();
    }
  };

  const addJornadaCheckRecord = (record: Omit<JornadaCheckRecord, 'id' | 'date'>) => {
    const newRecord = DB.addJornadaCheckRecord(record);
    if(newRecord) {
      setJornadaHistory(prev => [newRecord, ...prev]);
      DB.saveDb();
    }
  };

  const updateJornadaCheckRecord = (updatedRecord: JornadaCheckRecord) => {
    DB.updateJornadaCheckRecord(updatedRecord);
    setJornadaHistory(prev => prev.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec));
    DB.saveDb();
    setEditingJornadaRecord(null);
  };

  const startEditJornada = (record: JornadaCheckRecord) => {
    setEditingJornadaRecord(record);
    setCurrentScreen(Screen.JornadaCheck);
  };

  const cancelEditJornada = () => {
    setEditingJornadaRecord(null);
    setCurrentScreen(Screen.JornadaHistory);
  };

  const handleExport = () => {
    try {
        const exportData = DB.getExportData();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `chequeos-rutinas-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting data:", error);
        alert("Ocurrió un error al exportar los datos.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("El archivo no se pudo leer correctamente.");
              }
              const data: ExportData = JSON.parse(text);

              if (!data.operators || !data.servers || data.helpText === undefined || !data.checkHistory || !data.jornadaHistory) {
                   throw new Error("El archivo de importación tiene un formato inválido o está incompleto.");
              }
              
              DB.importData(data);
              await DB.saveDb();

              alert("Datos importados con éxito. La aplicación se recargará para aplicar los cambios.");
              window.location.reload();

          } catch (error: any) {
              console.error("Error importing data:", error);
              alert(`Ocurrió un error al importar los datos: ${error.message}`);
          } finally {
              event.target.value = '';
          }
      };
      reader.readAsText(file);
  };

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen operators={operators} setOperators={handleSetOperators} onLogin={handleLogin} />;
    }
    switch (currentScreen) {
      case Screen.Main:
        return <MainScreen onNavigate={setCurrentScreen} />;
      case Screen.CameraCheck:
        return <CameraCheckScreen servers={servers} helpText={helpText} currentUser={currentUser} addCheckRecord={addCameraCheckRecord} />;
      case Screen.CameraHistory:
        return <CameraHistoryScreen records={cameraHistory} operators={operators} servers={servers} />;
      case Screen.CameraAdmin:
        return <CameraAdminScreen 
                  servers={servers} 
                  setServers={handleSetServers} 
                  helpText={helpText} 
                  setHelpText={handleSetHelpText}
                  onExport={handleExport}
                  onImport={handleImport}
               />;
      case Screen.JornadaCheck:
        return <JornadaCheckScreen 
                  currentUser={currentUser} 
                  addJornadaCheckRecord={addJornadaCheckRecord} 
                  editingRecord={editingJornadaRecord}
                  updateJornadaCheckRecord={updateJornadaCheckRecord}
                  onCancelEdit={cancelEditJornada}
                  onNavigate={setCurrentScreen}
                />;
      case Screen.JornadaHistory:
        return <JornadaHistoryScreen records={jornadaHistory} operators={operators} onEdit={startEditJornada} />;
      default:
        return <LoginScreen operators={operators} setOperators={handleSetOperators} onLogin={handleLogin} />;
    }
  };

  if (!dbLoaded) {
    return (
      <div className="bg-slate-900 text-slate-200 min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
            <SpinnerIcon className="w-12 h-12 text-cyan-400 animate-spin"/>
            <p className="text-lg">Cargando base de datos...</p>
        </div>
      </div>
    );
  }

  const isCameraModule = [Screen.CameraCheck, Screen.CameraHistory, Screen.CameraAdmin].includes(currentScreen);
  const isJornadaModule = [Screen.JornadaCheck, Screen.JornadaHistory].includes(currentScreen);

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans flex flex-col">
      {currentUser ? (
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onNavigate={setCurrentScreen}
          activeScreen={currentScreen}
          isModuleActive={isCameraModule || isJornadaModule}
          isCameraModuleActive={isCameraModule}
          isJornadaModuleActive={isJornadaModule}
        />
      ) : (
        <header className="bg-slate-950 p-4 flex items-center justify-center shadow-lg">
            <AppIcon className="h-8 w-8 text-cyan-400 mr-3"/>
            <h1 className="text-2xl font-bold tracking-wider text-slate-100">Chequeos de Rutinas</h1>
        </header>
      )}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;