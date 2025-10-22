import React, { useState, useEffect } from 'react';
import { Screen, CameraCheckRecord, Server, JornadaCheckRecord, ExportData } from './types';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import CameraCheckScreen from './components/CameraCheckScreen';
import CameraHistoryScreen from './components/CameraHistoryScreen';
import CameraAdminScreen from './components/CameraAdminScreen';
import JornadaCheckScreen from './components/JornadaCheckScreen';
import JornadaHistoryScreen from './components/JornadaHistoryScreen';
import Header from './components/Header';
import { AppIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Login);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Shared state
  const [operators, setOperators] = useState<string[]>([]);

  // Camera Module State
  const [servers, setServers] = useState<Server[]>([]);
  const [helpText, setHelpText] = useState<string>('');
  const [cameraHistory, setCameraHistory] = useState<CameraCheckRecord[]>([]);
  
  // Jornada Module State
  const [jornadaHistory, setJornadaHistory] = useState<JornadaCheckRecord[]>([]);

  // Load all data from localStorage on initial render
  useEffect(() => {
    try {
      const storedOperators = localStorage.getItem('operators');
      if (storedOperators) setOperators(JSON.parse(storedOperators));
      else setOperators(['Operador A', 'Operador B']);

      const storedServers = localStorage.getItem('servers');
       if (storedServers) {
          const parsedServers = JSON.parse(storedServers);
          // Migration from old structure {name, devices} to new one {ip, cameras}
          if (parsedServers.length > 0 && parsedServers[0].name && parsedServers[0].devices) {
              const migratedServers: Server[] = parsedServers.flatMap((s: any, serverIndex: number) => 
                  s.devices.map((d: any, deviceIndex: number) => ({
                      id: `migrated-${serverIndex}-${deviceIndex}-${d.ip}`,
                      ip: d.ip,
                      cameras: d.cameras || []
                  }))
              );
              setServers(migratedServers);
          } else {
              setServers(parsedServers);
          }
      }
      else setServers([
        { id: 'server-1', ip: '192.168.200.213', cameras: [] },
        { id: 'server-2', ip: '192.168.200.214', cameras: [] }
      ]);
      
      const storedHelpText = localStorage.getItem('helpText');
      if (storedHelpText) setHelpText(storedHelpText);
      else setHelpText('Procedimiento de ejemplo: Si una cámara no graba, reinicie el servidor correspondiente. Si el problema persiste, contacte al soporte técnico en el anexo 555.');

      const storedCameraHistory = localStorage.getItem('checkHistory'); // Keep old name for compatibility
      if (storedCameraHistory) {
         const parsedHistory = JSON.parse(storedCameraHistory);
         // Basic migration for old data structure
         const migratedHistory = parsedHistory.map((rec: any) => {
            if (rec.deviceStates && !rec.cameraStates) {
              return { ...rec, cameraStates: {} }; // Old data is not compatible, start fresh
            }
            return rec;
         });
         setCameraHistory(migratedHistory);
      }

      const storedJornadaHistory = localStorage.getItem('jornadaHistory');
      if (storedJornadaHistory) setJornadaHistory(JSON.parse(storedJornadaHistory));

    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('operators', JSON.stringify(operators)); }, [operators]);
  useEffect(() => { localStorage.setItem('servers', JSON.stringify(servers)); }, [servers]);
  useEffect(() => { localStorage.setItem('helpText', helpText); }, [helpText]);
  useEffect(() => { localStorage.setItem('checkHistory', JSON.stringify(cameraHistory)); }, [cameraHistory]);
  useEffect(() => { localStorage.setItem('jornadaHistory', JSON.stringify(jornadaHistory)); }, [jornadaHistory]);


  const handleLogin = (user: string) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.Main);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen(Screen.Login);
  };
  
  const addCameraCheckRecord = (record: Omit<CameraCheckRecord, 'id' | 'date'>) => {
    const newRecord: CameraCheckRecord = {
      ...record,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    setCameraHistory(prev => [newRecord, ...prev]);
  };

  const addJornadaCheckRecord = (record: Omit<JornadaCheckRecord, 'id' | 'date'>) => {
    const newRecord: JornadaCheckRecord = {
      ...record,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    setJornadaHistory(prev => [newRecord, ...prev]);
  };

  const handleExport = () => {
    try {
        const exportData: ExportData = {
            operators,
            servers,
            helpText,
            checkHistory: cameraHistory,
            jornadaHistory: jornadaHistory,
        };
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
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("El archivo no se pudo leer correctamente.");
              }
              const data: ExportData = JSON.parse(text);

              // Basic validation
              if (!data.operators || !data.servers || data.helpText === undefined || !data.checkHistory || !data.jornadaHistory) {
                   throw new Error("El archivo de importación tiene un formato inválido o está incompleto.");
              }

              setOperators(data.operators);
              setServers(data.servers);
              setHelpText(data.helpText);
              setCameraHistory(data.checkHistory);
              setJornadaHistory(data.jornadaHistory);

              alert("Datos importados con éxito. La aplicación se recargará para aplicar los cambios.");
              window.location.reload();

          } catch (error: any) {
              console.error("Error importing data:", error);
              alert(`Ocurrió un error al importar los datos: ${error.message}`);
          } finally {
              // Reset file input to allow importing the same file again
              event.target.value = '';
          }
      };
      reader.readAsText(file);
  };

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen operators={operators} setOperators={setOperators} onLogin={handleLogin} />;
    }
    switch (currentScreen) {
      case Screen.Main:
        return <MainScreen onNavigate={setCurrentScreen} />;
      // Camera Module
      case Screen.CameraCheck:
        return <CameraCheckScreen servers={servers} helpText={helpText} currentUser={currentUser} addCheckRecord={addCameraCheckRecord} />;
      case Screen.CameraHistory:
        return <CameraHistoryScreen records={cameraHistory} operators={operators} servers={servers} />;
      case Screen.CameraAdmin:
        return <CameraAdminScreen 
                  servers={servers} 
                  setServers={setServers} 
                  helpText={helpText} 
                  setHelpText={setHelpText}
                  onExport={handleExport}
                  onImport={handleImport}
               />;
      // Jornada Module
      case Screen.JornadaCheck:
        return <JornadaCheckScreen currentUser={currentUser} addJornadaCheckRecord={addJornadaCheckRecord} />;
      case Screen.JornadaHistory:
        return <JornadaHistoryScreen records={jornadaHistory} operators={operators} />;
      default:
        return <LoginScreen operators={operators} setOperators={setOperators} onLogin={handleLogin} />;
    }
  };

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