import React from 'react';
import { Screen } from '../types';
import { AppIcon, UserIcon, LogoutIcon, CheckCircleIcon, HistoryIcon, CogIcon, HomeIcon, ClipboardCheckIcon } from './Icons';

interface HeaderProps {
  currentUser: string;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
  activeScreen: Screen;
  isModuleActive: boolean;
  isCameraModuleActive: boolean;
  isJornadaModuleActive: boolean;
}

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({label, icon, isActive, onClick}) => (
     <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
     >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, activeScreen, isModuleActive, isCameraModuleActive, isJornadaModuleActive }) => {
  return (
    <header className="bg-slate-950 p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <AppIcon className="h-7 w-7 text-cyan-400"/>
            <span className="text-lg font-bold text-slate-100 hidden md:block">Chequeos de Rutinas</span>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <nav className="flex items-center gap-2 sm:gap-3">
            {isModuleActive && (
                 <button 
                    onClick={() => onNavigate(Screen.Main)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-cyan-400 hover:bg-slate-700"
                    title="Volver al Menú Principal"
                 >
                    <HomeIcon className="w-5 h-5"/>
                    <span className="hidden lg:inline">Menú Principal</span>
                </button>
            )}
            {isCameraModuleActive && (
                <>
                    <NavButton label="Chequeo" icon={<CheckCircleIcon className="w-5 h-5"/>} isActive={activeScreen === Screen.CameraCheck} onClick={() => onNavigate(Screen.CameraCheck)} />
                    <NavButton label="Historial" icon={<HistoryIcon className="w-5 h-5"/>} isActive={activeScreen === Screen.CameraHistory} onClick={() => onNavigate(Screen.CameraHistory)} />
                    <NavButton label="Admin" icon={<CogIcon className="w-5 h-5"/>} isActive={activeScreen === Screen.CameraAdmin} onClick={() => onNavigate(Screen.CameraAdmin)} />
                </>
            )}
            {isJornadaModuleActive && (
                 <>
                    <NavButton label="Chequeo" icon={<ClipboardCheckIcon className="w-5 h-5"/>} isActive={activeScreen === Screen.JornadaCheck} onClick={() => onNavigate(Screen.JornadaCheck)} />
                    <NavButton label="Historial" icon={<HistoryIcon className="w-5 h-5"/>} isActive={activeScreen === Screen.JornadaHistory} onClick={() => onNavigate(Screen.JornadaHistory)} />
                </>
            )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300">
            <UserIcon className="w-5 h-5"/>
            <span className="text-sm font-medium hidden sm:block">{currentUser}</span>
        </div>
        <button 
            onClick={onLogout} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-red-600 hover:text-white rounded-md transition-colors"
            title="Salir"
        >
            <LogoutIcon className="w-5 h-5"/>
            <span className="hidden lg:block">Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Header;