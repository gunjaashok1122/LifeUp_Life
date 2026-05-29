import React from 'react';
import type { AvatarConfig } from '../context/AppContext';
import { useApp } from '../context/AppContext';
import { Camera } from 'lucide-react';

interface AvatarBuilderProps {
  config: AvatarConfig;
  size?: number;
  interactive?: boolean;
  showCamera?: boolean;
  profilePicture?: string;
  onCameraClick?: (e: React.MouseEvent) => void;
}

export const AvatarBuilder: React.FC<AvatarBuilderProps> = (props) => {
  const { config, size = 150, showCamera = true } = props;
  const { user, updateProfilePicture } = useApp();
  const { hair, armor, weapon, accessory, hairColor, skinColor, bgColor } = config;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateProfilePicture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const displayPicture = ('profilePicture' in props) ? props.profilePicture : user.profilePicture;

  return (
    <div 
      className="relative flex items-center justify-center rounded-full"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`
      }}
    >
      <div 
        className="w-full h-full rounded-full overflow-hidden shadow-inner border border-rpg-border/40 bg-slate-900 flex items-center justify-center"
        style={{ 
          backgroundColor: bgColor || '#1e293b' 
        }}
      >
        {displayPicture ? (
          <img 
            src={displayPicture} 
            className="w-full h-full object-cover animate-fade-in" 
            alt="User Profile" 
          />
        ) : (
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full select-none"
          >
            {/* Background Ambient Glow */}
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </radialGradient>
              
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {/* Ambient Glow behind player */}
            <circle cx="50" cy="50" r="45" fill="url(#glow)" />

            {/* --- ACCESSORY: WINGS (Back Layer) --- */}
            {accessory === 'wings' && (
              <g className="animate-float" style={{ transformOrigin: '50% 50%' }}>
                {/* Left Wing */}
                <path d="M 35 45 C 10 30, 5 60, 30 65 C 15 55, 15 45, 35 45 Z" fill="#93c5fd" opacity="0.8" />
                {/* Right Wing */}
                <path d="M 65 45 C 90 30, 95 60, 70 65 C 85 55, 85 45, 65 45 Z" fill="#93c5fd" opacity="0.8" />
              </g>
            )}

            {/* --- BODY & HEAD --- */}
            {/* Torso/Base */}
            <path d="M 30 85 C 30 65, 70 65, 70 85 Z" fill="#e2e8f0" />
            
            {/* Head */}
            <circle cx="50" cy="45" r="16" fill={skinColor || '#fecdd3'} />
            
            {/* Face details (Eyes & Smile) */}
            <circle cx="45" cy="43" r="2" fill="#0f172a" />
            <circle cx="55" cy="43" r="2" fill="#0f172a" />
            
            {/* Cute blush cheeks */}
            <circle cx="41" cy="46" r="1.5" fill="#f43f5e" opacity="0.6" />
            <circle cx="59" cy="46" r="1.5" fill="#f43f5e" opacity="0.6" />
            
            {/* Smile */}
            <path d="M 47 49 Q 50 52, 53 49" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

            {/* --- HAIR STYLES --- */}
            {hair === 'default' && (
              <path d="M 33 42 C 32 30, 68 30, 67 42 C 63 36, 37 36, 33 42 Z" fill={hairColor || '#f59e0b'} />
            )}
            
            {hair === 'spiky' && (
              <path d="M 32 43 L 34 32 L 40 37 L 46 28 L 51 37 L 57 28 L 61 36 L 66 31 L 68 43 C 62 38, 38 38, 32 43 Z" fill={hairColor || '#f59e0b'} />
            )}

            {hair === 'long' && (
              <g fill={hairColor || '#f59e0b'}>
                {/* Top Hair */}
                <path d="M 33 42 C 32 28, 68 28, 67 42 C 60 36, 40 36, 33 42 Z" />
                {/* Side Hair strands */}
                <path d="M 34 40 C 31 45, 30 55, 32 62 C 34 52, 36 45, 34 40 Z" />
                <path d="M 66 40 C 69 45, 70 55, 68 62 C 66 52, 64 45, 66 40 Z" />
              </g>
            )}

            {hair === 'wizard' && (
              <g>
                {/* Pointy Hood */}
                <path d="M 31 38 L 50 15 L 69 38 Z" fill="#6d28d9" />
                {/* Beard */}
                <path d="M 38 52 C 38 72, 62 72, 62 52 C 55 58, 45 58, 38 52 Z" fill="#f8fafc" />
                {/* Hood Trim */}
                <path d="M 31 38 C 40 43, 60 43, 69 38" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* --- ARMOR STYLES --- */}
            {armor === 'ragged' && (
              <g>
                {/* Simple ragged tunic */}
                <path d="M 30 75 L 70 75 L 66 90 L 34 90 Z" fill="#64748b" />
                {/* Ragged lines */}
                <line x1="38" y1="80" x2="35" y2="88" stroke="#475569" strokeWidth="1.5" />
                <line x1="62" y1="78" x2="65" y2="86" stroke="#475569" strokeWidth="1.5" />
              </g>
            )}

            {armor === 'leather' && (
              <g>
                {/* Leather Tunic */}
                <path d="M 30 72 C 30 65, 70 65, 70 72 L 66 90 L 34 90 Z" fill="#78350f" />
                {/* Pauldrons (Shoulders) */}
                <circle cx="31" cy="70" r="5" fill="#f59e0b" />
                <circle cx="69" cy="70" r="5" fill="#f59e0b" />
                {/* Chest straps */}
                <line x1="38" y1="72" x2="62" y2="84" stroke="#451a03" strokeWidth="2" />
                <line x1="62" y1="72" x2="38" y2="84" stroke="#451a03" strokeWidth="2" />
              </g>
            )}

            {armor === 'steel' && (
              <g>
                {/* Steel Plate */}
                <path d="M 28 72 C 28 62, 72 62, 72 72 L 67 90 L 33 90 Z" fill="url(#steelGrad)" />
                {/* Steel Pauldrons */}
                <path d="M 24 72 C 24 64, 36 64, 36 72 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
                <path d="M 64 72 C 64 64, 76 64, 76 72 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
                {/* Emblem */}
                <polygon points="50,72 54,77 50,82 46,77" fill="url(#goldGrad)" />
              </g>
            )}

            {armor === 'mage' && (
              <g>
                {/* Mage Robes */}
                <path d="M 28 70 C 28 60, 72 60, 72 70 L 68 90 L 32 90 Z" fill="#4c1d95" />
                {/* Gold Trim */}
                <path d="M 28 70 C 40 75, 60 75, 72 70" stroke="url(#goldGrad)" strokeWidth="1.8" fill="none" />
                {/* Magic gems/glow */}
                <circle cx="50" cy="78" r="2.5" fill="#a78bfa" className="animate-pulse" />
              </g>
            )}

            {/* --- WEAPON (Held in Right/Left Hand) --- */}
            {weapon === 'stick' && (
              <g className="animate-float" style={{ transformOrigin: '20% 75%' }}>
                {/* Stick weapon */}
                <path d="M 22 75 L 12 55 C 10 50, 15 48, 17 53 L 26 71 Z" fill="#78350f" />
                {/* Hand overlapping */}
                <circle cx="23" cy="73" r="3.5" fill={skinColor || '#fecdd3'} />
              </g>
            )}

            {weapon === 'sword' && (
              <g className="animate-float" style={{ transformOrigin: '20% 75%' }}>
                {/* Sword Blade */}
                <path d="M 22 75 L 8 40 L 4 41 L 18 76 Z" fill="url(#bladeGrad)" stroke="#64748b" strokeWidth="0.5" />
                {/* Crossguard */}
                <path d="M 14 70 L 25 65 L 23 62 L 12 67 Z" fill="url(#goldGrad)" />
                {/* Hand overlapping */}
                <circle cx="20" cy="72" r="3.5" fill={skinColor || '#fecdd3'} />
              </g>
            )}

            {weapon === 'staff' && (
              <g className="animate-float" style={{ transformOrigin: '20% 75%' }}>
                {/* Staff Shaft */}
                <line x1="20" y1="85" x2="10" y2="40" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
                {/* Glowing Orb */}
                <circle cx="8" cy="35" r="5" fill="#3b82f6" className="animate-pulse" />
                <circle cx="8" cy="35" r="8" fill="#60a5fa" opacity="0.3" className="animate-pulse" />
                {/* Hand overlapping */}
                <circle cx="17" cy="70" r="3.5" fill={skinColor || '#fecdd3'} />
              </g>
            )}

            {weapon === 'shield' && (
              <g className="animate-float" style={{ transformOrigin: '20% 75%' }}>
                {/* Shield Body */}
                <circle cx="18" cy="70" r="10" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                <circle cx="18" cy="70" r="7" fill="url(#steelGrad)" />
                {/* Shield Center Stud */}
                <polygon points="18,66 22,70 18,74 14,70" fill="url(#goldGrad)" />
                {/* Hand behind shield */}
                <circle cx="20" cy="70" r="3" fill={skinColor || '#fecdd3'} />
              </g>
            )}

            {/* --- ACCESSORY: OVERLAYS (Front Layer) --- */}
            {accessory === 'glasses' && (
              <g stroke="#334155" strokeWidth="1" fill="none">
                {/* Left Glass Lens */}
                <circle cx="45" cy="43" r="4.5" fill="rgba(147, 197, 253, 0.2)" />
                {/* Right Glass Lens */}
                <circle cx="55" cy="43" r="4.5" fill="rgba(147, 197, 253, 0.2)" />
                {/* Bridge */}
                <path d="M 49.5 43 Q 50 41, 50.5 43" />
              </g>
            )}

            {accessory === 'crown' && (
              <g>
                {/* Golden Crown */}
                <path d="M 37 32 L 35 23 L 42 27 L 50 20 L 58 27 L 65 23 L 63 32 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="0.5" />
                {/* Crown gems */}
                <circle cx="35" cy="23" r="1" fill="#ef4444" />
                <circle cx="50" cy="20" r="1.2" fill="#3b82f6" />
                <circle cx="65" cy="23" r="1" fill="#ef4444" />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Camera Button placed on the bottom right, outside the overflow-hidden container */}
      {showCamera && (
        <label 
          className="absolute bottom-0 right-0 w-8 h-8 bg-slate-950 border border-rpg-border/60 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 group/cam z-10"
          onClick={(e) => {
            e.stopPropagation();
            if (props.onCameraClick) {
              props.onCameraClick(e);
            }
          }}
          title="Upload custom picture"
        >
          <Camera className="w-4 h-4 text-rpg-xp group-hover/cam:text-white transition-colors" />
          {!props.onCameraClick && (
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          )}
        </label>
      )}
    </div>
  );
};
