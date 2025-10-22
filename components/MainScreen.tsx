import React from 'react';
import { Screen } from '../types';
import { AppIcon, ClipboardCheckIcon } from './Icons';

interface MainScreenProps {
  onNavigate: (screen: Screen) => void;
}

const ModuleCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-700 hover:border-cyan-500 hover:bg-slate-700/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
        >
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400">{description}</p>
            </div>
        </button>
    )
};


const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
  return (
    <div className="flex justify-center items-center h-full">
        <div className="w-full max-w-4xl text-center">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">Bienvenido al Sistema de Chequeos</h2>
            <p className="text-slate-400 mb-12 text-lg">Por favor, seleccione la rutina que desea realizar.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ModuleCard 
                    title="Registro de Chequeo de Cámaras"
                    description="Verificar el estado de grabación de las cámaras de seguridad."
                    icon={<AppIcon className="w-16 h-16"/>}
                    onClick={() => onNavigate(Screen.CameraCheck)}
                />
                <ModuleCard 
                    title="Chequeo de Rutinas de Jornada"
                    description="Registrar la finalización de las tareas diarias por turno."
                    icon={<ClipboardCheckIcon className="w-16 h-16"/>}
                    onClick={() => onNavigate(Screen.JornadaCheck)}
                />
            </div>
        </div>
    </div>
  );
};

export default MainScreen;