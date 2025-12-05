import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Utensils, Moon, Pizza, HeartPulse, Skull, 
  Activity, User, Check, RefreshCw, Zap, Save, Clock,
  LayoutDashboard, ListTodo, MessageSquare, Trophy, ChevronRight,
  Flame, Droplets, Brain, ShieldAlert, Sparkles
} from 'lucide-react';

// --- SOUND ENGINE ---
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
    } else if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    } else if (type === 'msg') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
    }
    osc.start(now);
    osc.stop(now + 0.4);
  }
};

// --- DATA ---
const INITIAL_QUESTS = [
  { id: 1, title: "Ledová Sprcha", xp: 50, type: "WILL", completed: false, icon: <Droplets size={18}/>, color: "text-cyan-400" },
  { id: 2, title: "Deep Work (90 min)", xp: 100, type: "INT", completed: false, icon: <Brain size={18}/>, color: "text-purple-400" },
  { id: 3, title: "Půst do 12:00", xp: 30, type: "BIO", completed: false, icon: <ShieldAlert size={18}/>, color: "text-emerald-400" },
  { id: 4, title: "Trénink (Zóna 2)", xp: 80, type: "STR", completed: false, icon: <Dumbbell size={18}/>, color: "text-blue-400" },
];

const LEADERBOARD = [
  { name: "IronMark", lvl: 42, score: 15400, color: "bg-blue-500" },
  { name: "Sarah_G", lvl: 38, score: 12100, color: "bg-pink-500" },
  { name: "Ty (Player 1)", lvl: 12, score: 4500, color: "bg-amber-500", isMe: true }, 
  { name: "LazyBob", lvl: 5, score: 1200, color: "bg-red-500" },
];

export default function AcirnfitApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [setupComplete, setSetupComplete] = useState(false);
  
  // --- STATE ---
  const [config, setConfig] = useState({ name: 'Hrdina', gender: 'male', skinTone: '#e0ac69', hairColor: '#2d241e' });
  const [bio, setBio] = useState({ 
    health: 100, energy: 80, fat: 15, muscle: 40, sleepDebt: 0, insulin: 10, 
    xp: 4500, level: 12 
  });
  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'mentor', text: 'Vstávat! Disciplína nepočká. Jaká je dnes tvá mise?' }
  ]);
  const [isDead, setIsDead] = useState(false);

  // --- INITIALIZATION & PERSISTENCE ---
  useEffect(() => {
    const savedBio = localStorage.getItem('acirnfit_bio_v7');
    const savedConfig = localStorage.getItem('acirnfit_config_v7');
    if (savedBio && savedConfig) {
      setBio(JSON.parse(savedBio));
      setConfig(JSON.parse(savedConfig));
      setSetupComplete(true);
    }
    SoundFX.init();
  }, []);

  useEffect(() => {
    if (setupComplete) {
      localStorage.setItem('acirnfit_bio_v7', JSON.stringify(bio));
      localStorage.setItem('acirnfit_config_v7', JSON.stringify(config));
    }
  }, [bio, config, setupComplete]);

  // --- METABOLISMUS (Game Loop) ---
  useEffect(() => {
    if (!setupComplete || isDead) return;
    const interval = setInterval(() => {
      setBio(prev => {
        let next = { ...prev };
        next.energy = Math.max(0, next.energy - 0.05);
        next.sleepDebt += 0.02;
        
        if (next.energy <= 0) next.health -= 0.05;
        if (next.sleepDebt > 90) next.health -= 0.05;
        if (next.health <= 0) setIsDead(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setupComplete, isDead]);

  // --- ACTIONS ---
  const handleAction = (type) => {
    SoundFX.play('action');
    setBio(prev => {
      let next = { ...prev };
      switch (type) {
        case 'TRAIN':
          next.energy = Math.max(0, next.energy - 15);
          next.muscle = Math.min(100, next.muscle + 3);
          next.fat = Math.max(5, next.fat - 1);
          break;
        case 'EAT_CLEAN':
          next.energy = Math.min(100, next.energy + 20);
          next.fat = Math.max(5, next.fat - 0.5);
          break;
        case 'CHEAT':
          next.energy = Math.min(100, next.energy + 40);
          next.fat += 2;
          next.insulin += 15;
          break;
        case 'SLEEP':
          next.sleepDebt = 0;
          next.energy = Math.max(0, next.energy - 10);
          break;
      }
      return next;
    });
  };

  const completeQuest = (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    SoundFX.play('success');
    setBio(p => ({ ...p, xp: p.xp + 100 }));
    setQuests(p => p.map(q => q.id === id ? { ...q, completed: true } : q));
  };

  const sendChatMessage = (text) => {
    const newMsg = { sender: 'user', text };
    setChatHistory(prev => [...prev, newMsg]);
    SoundFX.play('action');
    setTimeout(() => {
      let response = "Zajímavé. Pokračuj.";
      if (text.includes("unaven")) response = "Únava je jen pocit. Pokud máš tep, můžeš pracovat.";
      if (text.includes("hotovo")) response = "Dobrá práce. Ale neusni na vavřínech. Další úkol?";
      setChatHistory(prev => [...prev, { sender: 'mentor', text: response }]);
      SoundFX.play('msg');
    }, 1000);
  };

  if (!setupComplete) return <SetupScreen config={config} setConfig={setConfig} onStart={() => setSetupComplete(true)} />;

  return (
    <div className="h-screen bg-[#0f172a] text-slate-100 font-sans flex flex-col overflow-hidden selection:bg-cyan-500/30">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* HEADER */}
      <header className="relative z-10 p-4 pb-2 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              {bio.level}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">{config.name.toUpperCase()}</h1>
            <div className="text-[10px] text-slate-400 font-mono">{bio.xp} XP / NEXT LVL</div>
          </div>
        </div>
        <div className="flex gap-3">
           <StatBadge icon={<HeartPulse size={14}/>} val={bio.health} color="text-red-400" />
           <StatBadge icon={<Zap size={14}/>} val={bio.energy} color="text-yellow-400" />
        </div>
      </header>

      {/* MAIN SCROLLABLE AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-24 scrollbar-hide">
        
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            
            {/* AVATAR STAGE */}
            <div className="relative h-[380px] w-full flex items-center justify-center">
               <Avatar3D bio={bio} config={config} isDead={isDead} />
               
               {/* Floating Stats */}
               <div className="absolute left-0 top-10 space-y-2">
                 <MiniStat label="SVALY" val={bio.muscle} color="bg-blue-500" />
                 <MiniStat label="TUK" val={bio.fat} color="bg-yellow-500" />
               </div>
               <div className="absolute right-0 top-10 space-y-2 text-right">
                 <MiniStat label="STRES" val={bio.sleepDebt} color="bg-red-500" right />
                 <MiniStat label="INSULIN" val={bio.insulin} color="bg-green-500" right />
               </div>
            </div>

            {/* ACTION GRID (Glassmorphism) */}
            <div className="grid grid-cols-2 gap-3">
              <ActionButton 
                title="Trénink" sub="+Svaly -Energie" 
                icon={<Dumbbell className="text-blue-400"/>} 
                onClick={() => handleAction('TRAIN')} 
              />
              <ActionButton 
                title="Jídlo" sub="+Energie -Tuk" 
                icon={<Utensils className="text-emerald-400"/>} 
                onClick={() => handleAction('EAT_CLEAN')} 
              />
              <ActionButton 
                title="Cheat" sub="++Energie +Tuk" 
                icon={<Pizza className="text-orange-400"/>} 
                onClick={() => handleAction('CHEAT')} 
              />
              <ActionButton 
                title="Spánek" sub="Reset Stresu" 
                icon={<Moon className="text-indigo-400"/>} 
                onClick={() => handleAction('SLEEP')} 
              />
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ListTodo className="text-cyan-400"/> Denní Protokol
            </h2>
            <div className="space-y-3">
              {quests.map(q => (
                <div key={q.id} onClick={() => completeQuest(q.id)}
                     className={`relative p-4 rounded-2xl border transition-all active:scale-95 cursor-pointer overflow-hidden ${q.completed ? 'bg-slate-900/30 border-slate-800 opacity-50' : 'bg-slate-800/50 border-white/10 hover:border-cyan-500/50 hover:bg-slate-800'}`}>
                   <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl bg-slate-950 ${q.color}`}>{q.icon}</div>
                       <div>
                         <div className="font-bold">{q.title}</div>
                         <div className="text-xs text-slate-400">+{q.xp} XP • {q.type}</div>
                       </div>
                     </div>
                     {q.completed ? <Check className="text-green-500"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>}
                   </div>
                   {q.completed && <div className="absolute inset-0 bg-green-500/10"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {activeTab === 'social' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-400"/> Elitní Žebříček
            </h2>
            <div className="space-y-2">
              {LEADERBOARD.map((u, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${u.isMe ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/30 border-white/5'}`}>
                   <div className="flex items-center gap-4">
                     <div className="font-mono font-bold text-slate-500 w-4">{i+1}</div>
                     <div className={`w-10 h-10 rounded-full ${u.color} flex items-center justify-center text-black font-bold text-xs`}>
                       {u.name.charAt(0)}
                     </div>
                     <div>
                       <div className={`font-bold ${u.isMe ? 'text-blue-400' : 'text-white'}`}>{u.name}</div>
                       <div className="text-xs text-slate-500">Level {u.lvl}</div>
                     </div>
                   </div>
                   <div className="font-mono font-bold">{u.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* TAB BAR (Bottom Navigation) */}
      <nav className="relative z-20 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center pb-8">
        <NavBtn icon={<LayoutDashboard/>} label="Domů" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavBtn icon={<ListTodo/>} label="Úkoly" active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
        <NavBtn icon={<MessageSquare/>} label="Mentor" active={activeTab === 'mentor'} onClick={() => setActiveTab('mentor')} />
        <NavBtn icon={<Trophy/>} label="Žebříček" active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
      </nav>

    </div>
  );
}

// --- COMPONENTS ---

function StatBadge({ icon, val, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-white/5 font-mono font-bold ${color}`}>
      {icon} <span>{Math.round(val)}%</span>
    </div>
  )
}

function MiniStat({ label, val, color, right }) {
  return (
    <div className={`flex flex-col ${right ? 'items-end' : 'items-start'}`}>
      <div className="text-[9px] font-bold text-slate-500 mb-1">{label}</div>
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${val}%` }}></div>
      </div>
    </div>
  )
}

function ActionButton({ title, sub, icon, onClick }) {
  return (
    <button onClick={onClick} className="group bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-cyan-500/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
      <div className="p-3 rounded-xl bg-slate-950 group-hover:scale-110 transition-transform shadow-lg">{icon}</div>
      <div className="text-center">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-[10px] text-slate-400">{sub}</div>
      </div>
    </button>
  )
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  )
}

function SetupScreen({ config, setConfig, onStart }) {
  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/30">
        <Activity size={40} className="text-black" />
      </div>
      <h1 className="text-4xl font-black mb-2 tracking-tight">ACIRNFIT</h1>
      <p className="text-slate-400 mb-10 max-w-xs">Optimalizuj svůj biologický hardware.</p>
      
      <div className="w-full max-w-sm space-y-4 text-left">
        <div>
          <label className="text-xs font-bold text-slate-500 ml-1">KÓDOVÉ JMÉNO</label>
          <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})}
                 className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 mt-1 focus:border-cyan-500 outline-none font-bold"/>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setConfig({...config, gender: 'male'})} className={`flex-1 p-4 rounded-xl border font-bold ${config.gender==='male'?'bg-blue-600 border-blue-400':'bg-slate-900 border-slate-800 text-slate-500'}`}>MUŽ</button>
           <button onClick={() => setConfig({...config, gender: 'female'})} className={`flex-1 p-4 rounded-xl border font-bold ${config.gender==='female'?'bg-pink-600 border-pink-400':'bg-slate-900 border-slate-800 text-slate-500'}`}>ŽENA</button>
        </div>
      </div>
      
      <button onClick={() => { SoundFX.init(); onStart(); }} 
              className="w-full max-w-sm mt-12 bg-white text-black font-black py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        INICIALIZOVAT SYSTÉM
      </button>
    </div>
  )
}

// --- PREMIUM SVG AVATAR (High Fidelity) ---
function Avatar3D({ bio, config, isDead }) {
  if (isDead) return (
    <div className="flex flex-col items-center justify-center animate-pulse text-red-500">
      <Skull size={80} strokeWidth={1} />
      <h2 className="text-3xl font-black mt-4">BIOLOGICAL FAILURE</h2>
    </div>
  );

  const isMale = config.gender === 'male';
  const muscleMod = bio.muscle / 100;
  const fatMod = bio.fat / 100;

  // Proportions
  const shoulderW = isMale ? 100 + (muscleMod * 40) : 80 + (muscleMod * 20);
  const waistW = isMale ? 70 + (fatMod * 60) : 60 + (fatMod * 50);
  const armThick = 15 + (muscleMod * 15);
  
  // Colors
  const skin = config.skinTone;
  const shirt = isMale ? '#3b82f6' : '#ec4899';

  return (
    <svg width="300" height="380" viewBox="0 0 300 380" className="drop-shadow-2xl transition-all duration-1000">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skin} style={{filter:'brightness(1.1)'}}/>
          <stop offset="100%" stopColor={skin} style={{filter:'brightness(0.9)'}}/>
        </linearGradient>
        <linearGradient id="clothGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shirt} style={{filter:'brightness(1.2)'}}/>
          <stop offset="100%" stopColor={shirt} style={{filter:'brightness(0.8)'}}/>
        </linearGradient>
        <filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={shirt} floodOpacity="0.3"/></filter>
      </defs>

      <g transform="translate(150, 50)">
        
        {/* LEGS */}
        <path d="M -30 180 L -35 300 L -10 300 L -5 180 Z" fill="#1e293b" />
        <path d="M 30 180 L 35 300 L 10 300 L 5 180 Z" fill="#1e293b" />

        {/* TORSO (Morphing Path) */}
        <path 
          d={`
            M -${shoulderW/2} 40 
            Q 0 ${50 + (muscleMod * 10)} ${shoulderW/2} 40 
            L ${waistW/2} 150 
            L -${waistW/2} 150 
            Z
          `} 
          fill="url(#clothGrad)" filter="url(#glow)"
          className="transition-all duration-700 ease-in-out"
        />

        {/* ARMS */}
        <path d={`M -${shoulderW/2 - 5} 50 Q -${shoulderW/2 + 20} 100 -${waistW/2 + 15} 140`} stroke="url(#bodyGrad)" strokeWidth={armThick} strokeLinecap="round" fill="none" />
        <path d={`M ${shoulderW/2 - 5} 50 Q ${shoulderW/2 + 20} 100 ${waistW/2 + 15} 140`} stroke="url(#bodyGrad)" strokeWidth={armThick} strokeLinecap="round" fill="none" />

        {/* NECK */}
        <rect x="-12" y="20" width="24" height="30" fill="url(#bodyGrad)" rx="8" />

        {/* HEAD */}
        <g>
          <rect x="-25" y="-30" width="50" height="60" rx="20" fill="url(#bodyGrad)" />
          {/* Hair */}
          <path d="M -28 -20 Q 0 -60 28 -20 L 28 -10 L -28 -10 Z" fill={config.hairColor} />
          {/* Face */}
          <circle cx="-12" cy="-5" r="3" fill="#1e293b" />
          <circle cx="12" cy="-5" r="3" fill="#1e293b" />
          {/* Eye Bags */}
          <path d="M -16 -2 Q -12 4 -8 -2" stroke="#4c1d95" strokeWidth="2" fill="none" style={{opacity: bio.sleepDebt/100}} />
          <path d="M 8 -2 Q 12 4 16 -2" stroke="#4c1d95" strokeWidth="2" fill="none" style={{opacity: bio.sleepDebt/100}} />
          {/* Mouth */}
          <path d={`M -10 ${bio.health > 50 ? 15 : 20} Q 0 ${bio.health > 50 ? 20 : 15} 10 ${bio.health > 50 ? 15 : 20}`} stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

      </g>
    </svg>
  );
}
