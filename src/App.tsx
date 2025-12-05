import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Utensils, Moon, Pizza, HeartPulse, Skull, 
  Activity, User, Check, RefreshCw, Zap, Save, Clock,
  LayoutDashboard, ListTodo, MessageSquare, Trophy, ChevronRight,
  Flame, Droplets, Brain, ShieldAlert
} from 'lucide-react';

// --- SOUND ENGINE (Audio Syntetizér) ---
const SoundFX = {
  ctx: null,
  init: () => {
    if (!SoundFX.ctx && typeof window !== 'undefined') {
      SoundFX.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play: (type) => {
    if (!SoundFX.ctx) return;
    const osc = SoundFX.ctx.createOscillator();
    const gain = SoundFX.ctx.createGain();
    osc.connect(gain);
    gain.connect(SoundFX.ctx.destination);
    const now = SoundFX.ctx.currentTime;
    
    if (type === 'action') {
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    } else if (type === 'msg') {
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

// --- VÝCHOZÍ DATA ---
const INITIAL_QUESTS = [
  { id: 1, title: "Ledová Sprcha", xp: 50, type: "WILL", completed: false, icon: <Droplets size={16}/> },
  { id: 2, title: "Deep Work (90 min)", xp: 100, type: "INT", completed: false, icon: <Brain size={16}/> },
  { id: 3, title: "Bez cukru do 12:00", xp: 30, type: "BIO", completed: false, icon: <ShieldAlert size={16}/> },
  { id: 4, title: "Trénink (Zóny 2)", xp: 80, type: "STR", completed: false, icon: <Dumbbell size={16}/> },
];

const LEADERBOARD_DATA = [
  { name: "IronMark", level: 42, score: 15400, avatar: "#3b82f6" },
  { name: "Sarah_G", level: 38, score: 12100, avatar: "#ec4899" },
  { name: "Ty (Player 1)", level: 12, score: 4500, avatar: "#f5d0b0", isMe: true }, 
  { name: "LazyBob", level: 5, score: 1200, avatar: "#ef4444" },
];

export default function AcirnfitUltimate() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [setupComplete, setSetupComplete] = useState(false);
  
  // --- HLAVNÍ STAV APLIKACE ---
  const [config, setConfig] = useState({ name: 'Player 1', gender: 'male', skinTone: '#e0ac69', hairColor: '#2d241e' });
  
  // Bio-Statistiky: 
  // Muscle 0-100 (ovlivňuje šířku ramen)
  // Fat 0-100 (ovlivňuje břicho a obličej)
  // SleepDebt 0-100 (ovlivňuje kruhy pod očima)
  const [bio, setBio] = useState({ 
    health: 100, 
    energy: 80, 
    fat: 15, 
    muscle: 40, 
    sleepDebt: 0, 
    insulin: 10, 
    xp: 4500, 
    level: 12 
  });
  
  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'mentor', text: 'Vstávat! Disciplína nepočká. Jaká je dnes tvá mise?' }
  ]);
  const [isDead, setIsDead] = useState(false);

  // --- NAČÍTÁNÍ A UKLÁDÁNÍ (PERSISTENCE) ---
  useEffect(() => {
    const saved = localStorage.getItem('acirnfit_v6_bio');
    const savedConfig = localStorage.getItem('acirnfit_v6_config');
    if (saved && savedConfig) {
      setBio(JSON.parse(saved));
      setConfig(JSON.parse(savedConfig));
      setSetupComplete(true);
    }
    SoundFX.init();
  }, []);

  useEffect(() => {
    if(setupComplete) {
      localStorage.setItem('acirnfit_v6_bio', JSON.stringify(bio));
      localStorage.setItem('acirnfit_v6_config', JSON.stringify(config));
    }
  }, [bio, config, setupComplete]);

  // --- HERNÍ SMYČKA (METABOLISMUS) ---
  useEffect(() => {
    if (!setupComplete || isDead) return;
    const interval = setInterval(() => {
      setBio(prev => {
        let next = { ...prev };
        // Energie klesá, stres roste
        next.energy = Math.max(0, next.energy - 0.05); 
        next.sleepDebt += 0.02;
        
        // Penalizace za zanedbání
        if (next.energy <= 0) next.health -= 0.05;
        if (next.sleepDebt > 90) next.health -= 0.05;
        
        // Smrt
        if (next.health <= 0) setIsDead(true);
        return next;
      });
    }, 1000); // Každou sekundu
    return () => clearInterval(interval);
  }, [setupComplete, isDead]);

  // --- HERNÍ LOGIKA ---
  const completeQuest = (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    SoundFX.play('success');
    
    setBio(prev => ({
      ...prev,
      xp: prev.xp + quest.xp,
      energy: Math.max(0, prev.energy - 10), // Práce stojí energii
      muscle: quest.type === 'STR' ? Math.min(100, prev.muscle + 5) : prev.muscle,
      fat: quest.type === 'STR' || quest.type === 'BIO' ? Math.max(5, prev.fat - 2) : prev.fat,
      sleepDebt: quest.type === 'WILL' ? Math.max(0, prev.sleepDebt - 10) : prev.sleepDebt
    }));
    
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
  };

  const sendChatMessage = (text) => {
    const newMsg = { sender: 'user', text };
    setChatHistory(prev => [...prev, newMsg]);
    SoundFX.play('action');
    
    // Simulace AI Mentora (Goggins Style)
    setTimeout(() => {
      let response = "Zajímavé. Ale slova jsou levná. Ukaž mi výsledky.";
      if (text.includes("unaven")) response = "Únava je jen emoce. Tvé tělo má ještě 40% rezervu. Makej.";
      if (text.includes("hlad")) response = "Hlad je jen hormon. Napij se vody a soustřeď se.";
      if (text.includes("hotovo")) response = "Dobrá práce. Jsi o krok blíž k tomu nebýt průměrný.";
      
      setChatHistory(prev => [...prev, { sender: 'mentor', text: response }]);
      SoundFX.play('msg');
    }, 1000);
  };

  // --- OBRAZOVKY ---
  if (!setupComplete) return <SetupScreen config={config} setConfig={setConfig} onComplete={() => setSetupComplete(true)} />;

  return (
    <div className="h-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden max-w-md mx-auto border-x border-slate-800 shadow-2xl relative">
      
      {/* 1. HORNÍ LIŠTA (STATUS) */}
      <div className="bg-slate-900/80 backdrop-blur-md p-3 flex justify-between items-center border-b border-white/5 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-xs shadow-lg">
            {bio.level}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">{config.name}</div>
            <div className="text-[10px] text-slate-400">{bio.xp} XP</div>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-mono">
           <div className="text-red-400 flex items-center gap-1"><HeartPulse size={12}/> {Math.round(bio.health)}%</div>
           <div className="text-yellow-400 flex items-center gap-1"><Zap size={12}/> {Math.round(bio.energy)}%</div>
        </div>
      </div>

      {/* 2. HLAVNÍ OBSAH */}
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide bg-slate-950">
        
        {/* ZÁLOŽKA: DOMŮ (AVATAR) */}
        {activeTab === 'home' && (
          <div className="p-4 flex flex-col items-center">
             
             {/* THE NEW SVG AVATAR */}
             <div className="w-full h-[360px] relative flex items-center justify-center mb-4">
               {/* Ambient Glow */}
               <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
               
               <AvatarDisplay bio={bio} config={config} isDead={isDead} />
             </div>

             {/* Statistiky */}
             <div className="w-full grid grid-cols-2 gap-3">
               <StatusCard label="SVALY" val={bio.muscle} max={100} color="bg-blue-500" />
               <StatusCard label="TUK" val={bio.fat} max={50} color="bg-yellow-500" reverse />
               <StatusCard label="STRES" val={bio.sleepDebt} max={100} color="bg-red-500" reverse />
               <StatusCard label="INZULIN" val={bio.insulin} max={100} color="bg-green-500" reverse />
             </div>

             {/* Rychlé Akce */}
             <div className="mt-6 w-full bg-slate-900 p-4 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center gap-2"><Flame size={12}/> Metabolické Akce</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setBio(p => ({...p, energy: Math.min(100, p.energy+20), fat: p.fat + 2, insulin: p.insulin + 20}))} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-xs font-bold text-yellow-400 transition-colors border border-white/5">Cheat Meal (+Tuk)</button>
                  <button onClick={() => setBio(p => ({...p, energy: Math.min(100, p.energy+15), fat: Math.max(5, p.fat - 1)}))} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-xs font-bold text-green-400 transition-colors border border-white/5">Clean Food (-Tuk)</button>
                  <button onClick={() => setBio(p => ({...p, energy: Math.max(0, p.energy-15), muscle: Math.min(100, p.muscle + 5)}))} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-xs font-bold text-blue-400 transition-colors border border-white/5">Trénink (+Svaly)</button>
                  <button onClick={() => setBio(p => ({...p, sleepDebt: 0, energy: Math.max(0, p.energy-5)}))} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-xs font-bold text-indigo-400 transition-colors border border-white/5">Spánek (-Stres)</button>
                </div>
             </div>
          </div>
        )}

        {/* ZÁLOŽKA: ÚKOLY */}
        {activeTab === 'quests' && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ListTodo className="text-cyan-400"/> Denní Protokol</h2>
            <div className="space-y-3">
              {quests.map(q => (
                <div key={q.id} onClick={() => completeQuest(q.id)} 
                     className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-95 ${q.completed ? 'bg-slate-900/50 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700 hover:border-cyan-500'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${q.completed ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {q.completed ? <Check size={16}/> : q.icon}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${q.completed && 'line-through'}`}>{q.title}</div>
                        <div className="text-[10px] text-slate-400">+{q.xp} XP • {q.type}</div>
                      </div>
                   </div>
                   {!q.completed && <ChevronRight size={16} className="text-slate-500"/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZÁLOŽKA: MENTOR */}
        {activeTab === 'mentor' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 rounded-tr-none' : 'bg-slate-800 rounded-tl-none'}`}>
                    {msg.sender === 'mentor' && <div className="text-[10px] text-cyan-400 mb-1 font-bold">GOGGINS AI</div>}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/5 flex gap-2">
              <input type="text" placeholder="Zadej zprávu..." className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 text-sm focus:border-cyan-500 outline-none" 
                     onKeyDown={(e) => { if(e.key === 'Enter') { sendChatMessage(e.target.value); e.target.value = ''; }}} />
              <button className="p-2 bg-cyan-500 rounded-full text-black"><Zap size={18}/></button>
            </div>
          </div>
        )}

        {/* ZÁLOŽKA: ŽEBŘÍČEK */}
        {activeTab === 'social' && (
          <div className="p-4">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="text-yellow-400"/> Globální Elita</h2>
             <div className="space-y-2">
               {LEADERBOARD_DATA.map((u, i) => (
                 <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${u.isMe ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center gap-3">
                       <div className="font-mono font-bold text-slate-500 w-4">#{i+1}</div>
                       <div className="w-8 h-8 rounded-full" style={{backgroundColor: u.avatar}}></div>
                       <div>
                         <div className={`text-sm font-bold ${u.isMe ? 'text-blue-400' : 'text-white'}`}>{u.name}</div>
                         <div className="text-[10px] text-slate-500">Lvl {u.level}</div>
                       </div>
                    </div>
                    <div className="font-mono font-bold">{u.score}</div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>

      {/* 3. DOLNÍ NAVIGACE */}
      <div className="absolute bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-white/5 flex justify-around p-2 pb-4 z-30">
        <NavBtn icon={<LayoutDashboard/>} label="Domů" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavBtn icon={<ListTodo/>} label="Úkoly" active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
        <NavBtn icon={<MessageSquare/>} label="Mentor" active={activeTab === 'mentor'} onClick={() => setActiveTab('mentor')} />
        <NavBtn icon={<Trophy/>} label="Žebříček" active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
      </div>
    </div>
  );
}

// --- POMOCNÉ KOMPONENTY ---

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={() => { SoundFX.play('action'); onClick(); }} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
       {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
       <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}

function StatusCard({ label, val, max, color, reverse }) {
  const percent = Math.min(100, (val / max) * 100);
  return (
    <div className="bg-slate-900 p-2 rounded-lg border border-white/5">
       <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-bold">
         <span>{label}</span> <span>{Math.round(val)}</span>
       </div>
       <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
         <div className={`h-full ${color} transition-all duration-500`} style={{width: `${percent}%`}}></div>
       </div>
    </div>
  )
}

function SetupScreen({ config, setConfig, onComplete }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-8">Acirnfit</h1>
      <div className="w-full max-w-sm space-y-4">
        <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} 
               className="w-full p-4 bg-slate-900 rounded-xl border border-slate-800 text-center font-bold outline-none focus:border-cyan-500" placeholder="Jméno Hrdiny"/>
        <div className="flex gap-2">
           <button onClick={() => setConfig({...config, gender: 'male'})} className={`flex-1 p-4 rounded-xl border ${config.gender==='male'?'bg-blue-600 border-blue-400':'bg-slate-900 border-slate-800'}`}>Muž</button>
           <button onClick={() => setConfig({...config, gender: 'female'})} className={`flex-1 p-4 rounded-xl border ${config.gender==='female'?'bg-pink-600 border-pink-400':'bg-slate-900 border-slate-800'}`}>Žena</button>
        </div>
        <div className="flex gap-2 justify-center">
            {['#f5d0b0', '#e0ac69', '#8d5524', '#3c2e28'].map(c => (
              <button key={c} onClick={() => setConfig({...config, skinTone: c})} className="w-8 h-8 rounded-full border-2 border-slate-700" style={{backgroundColor: c, borderColor: config.skinTone === c ? 'white' : 'transparent'}} />
            ))}
        </div>
        <button onClick={onComplete} className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl shadow-lg shadow-cyan-500/20 mt-4">START GAME</button>
      </div>
    </div>
  )
}

// --- PREMIUM SVG AVATAR (Grafika na úrovni Unicornu) ---
function AvatarDisplay({ bio, config, isDead }) {
  if (isDead) return (
    <div className="h-[320px] w-full flex flex-col items-center justify-center text-red-500 animate-pulse">
      <Skull size={80} />
      <div className="font-black text-3xl mt-4 tracking-widest">GAME OVER</div>
      <div className="text-sm text-red-400 mt-2">Příčina: Systémové selhání</div>
    </div>
  );

  // --- VÝPOČET MORFOLOGIE (Tady se děje kouzlo) ---
  const isMale = config.gender === 'male';
  
  // Základní rozměry
  const shoulders = isMale ? 100 : 80;
  const waist = isMale ? 70 : 60;
  const hips = isMale ? 70 : 85;

  // Svalový faktor (0.0 - 1.0)
  const muscleFactor = bio.muscle / 100; 
  const shoulderBulk = muscleFactor * 30; // Ramena se rozšiřují
  const armBulk = muscleFactor * 15;      // Paže mohutní
  const chestBulk = muscleFactor * 10;    // Hrudník se klene

  // Tukový faktor (0.0 - 1.0)
  const fatFactor = bio.fat / 100; 
  const waistBulk = fatFactor * 50; // Břicho se rozšiřuje
  const faceRoundness = fatFactor * 10; // Obličej se kulatí

  // Barvy
  const skin = config.skinTone;
  const shirtColor = isMale ? '#3b82f6' : '#ec4899';
  const pantsColor = '#1e293b';

  return (
    <svg width="260" height="340" viewBox="0 0 260 340" className="drop-shadow-2xl transition-all duration-700">
      <defs>
        {/* Gradienty pro 3D efekt */}
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={skin} style={{filter: 'brightness(0.9)'}} />
          <stop offset="50%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} style={{filter: 'brightness(0.9)'}} />
        </linearGradient>
        <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={shirtColor} style={{filter: 'brightness(1.1)'}} />
          <stop offset="100%" stopColor={shirtColor} style={{filter: 'brightness(0.8)'}} />
        </linearGradient>
        <filter id="shadow">
           <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>

      <g transform="translate(130, 40)"> {/* Centrování na střed */}
        
        {/* --- NOHY --- */}
        <path 
          d={`M -${hips/2 - 10} 160 L -${hips/2 - 5} 280 L -${hips/2 + 15} 280 L -${hips/2 + 20} 160 Z`} 
          fill={pantsColor} 
        />
        <path 
          d={`M ${hips/2 - 10} 160 L ${hips/2 - 5} 280 L ${hips/2 + 15} 280 L ${hips/2 + 20} 160 Z`} 
          fill={pantsColor} 
        />

        {/* --- TĚLO (TORZO) --- */}
        {/* Morfující cesta (Path) - mění tvar podle svalů a tuku */}
        <path 
          d={`
            M -${shoulders/2 + shoulderBulk} 40 
            Q 0 ${45 + chestBulk} ${shoulders/2 + shoulderBulk} 40 
            L ${waist/2 + waistBulk} 140 
            L ${hips/2 + (waistBulk * 0.2)} 160
            L -${hips/2 + (waistBulk * 0.2)} 160
            L -${waist/2 + waistBulk} 140
            Z
          `} 
          fill="url(#shirtGrad)" 
          filter="url(#shadow)"
          className="transition-all duration-700 ease-in-out"
        />

        {/* Viscerální tuk (Jemný stín pupku, když je tuk vysoko) */}
        {bio.fat > 20 && (
          <ellipse 
            cx="0" cy="120" 
            rx={waistBulk * 0.8} ry={waistBulk * 0.6} 
            fill="rgba(0,0,0,0.1)" 
            className="transition-all duration-700"
          />
        )}

        {/* --- PAŽE --- */}
        {/* Levá ruka */}
        <path 
          d={`
            M -${shoulders/2 + shoulderBulk - 5} 45 
            Q -${shoulders/2 + shoulderBulk + 15 + armBulk} 90 -${waist/2 + waistBulk + 10} 130
            L -${waist/2 + waistBulk} 130
            Q -${shoulders/2 + shoulderBulk + armBulk} 90 -${shoulders/2 + shoulderBulk - 15} 55
            Z
          `} 
          fill="url(#skinGrad)" 
          className="transition-all duration-700"
        />
        {/* Pravá ruka */}
        <path 
          d={`
            M ${shoulders/2 + shoulderBulk - 5} 45 
            Q ${shoulders/2 + shoulderBulk + 15 + armBulk} 90 ${waist/2 + waistBulk + 10} 130
            L ${waist/2 + waistBulk} 130
            Q ${shoulders/2 + shoulderBulk + armBulk} 90 ${shoulders/2 + shoulderBulk - 15} 55
            Z
          `} 
          fill="url(#skinGrad)" 
          className="transition-all duration-700"
        />

        {/* --- KRK --- */}
        <rect x="-10" y="20" width="20" height="25" fill="url(#skinGrad)" rx="5" />

        {/* --- HLAVA --- */}
        <rect 
          x={-22 - faceRoundness/2} y="-30" 
          width={44 + faceRoundness} height={55} 
          rx={18 + faceRoundness/2} ry={18 + faceRoundness/2} 
          fill="url(#skinGrad)" 
          className="transition-all duration-700"
        />

        {/* Vlasy */}
        <path 
          d={`
            M -${24 + faceRoundness/2} -20 
            Q 0 -60 ${24 + faceRoundness/2} -20 
            L ${24 + faceRoundness/2} -5 
            L -${24 + faceRoundness/2} -5 
            Z
          `} 
          fill={config.hairColor} 
        />

        {/* Obličej */}
        <g transform="translate(0, 0)">
           {/* Oči */}
           <ellipse cx="-10" cy="-5" rx="3" ry="2" fill="white" />
           <circle cx="-10" cy="-5" r="1.5" fill="black" />
           <ellipse cx="10" cy="-5" rx="3" ry="2" fill="white" />
           <circle cx="10" cy="-5" r="1.5" fill="black" />

           {/* Kruhy pod očima (Reagují na sleepDebt) */}
           <path 
             d="M -14 -2 Q -10 2 -6 -2" 
             stroke="rgba(76, 29, 149, 0.5)" strokeWidth="1.5" fill="none" 
             style={{opacity: bio.sleepDebt/100}} 
           />
           <path 
             d="M 6 -2 Q 10 2 14 -2" 
             stroke="rgba(76, 29, 149, 0.5)" strokeWidth="1.5" fill="none" 
             style={{opacity: bio.sleepDebt/100}} 
           />

           {/* Pusa (Reaguje na zdraví) */}
           {bio.health > 50 ? (
             <path d="M -8 15 Q 0 20 8 15" stroke="rgba(0,0,0,0.6)" strokeWidth="2" strokeLinecap="round" fill="none" />
           ) : (
             <path d="M -8 20 Q 0 15 8 20" stroke="rgba(0,0,0,0.6)" strokeWidth="2" strokeLinecap="round" fill="none" />
           )}
        </g>

        {/* Pot (Při cvičení nebo obezitě) */}
        {(bio.energy < 20 || bio.fat > 40) && (
           <g className="animate-pulse">
             <path d="M 25 -25 Q 28 -20 25 -15" stroke="#38bdf8" strokeWidth="2" fill="none" />
             <path d="M -25 -20 Q -28 -15 -25 -10" stroke="#38bdf8" strokeWidth="2" fill="none" />
           </g>
        )}

      </g>
    </svg>
  );
}