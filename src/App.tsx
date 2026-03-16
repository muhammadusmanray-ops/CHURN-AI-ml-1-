import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import Papa from 'papaparse';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  Cpu, 
  Send, 
  Terminal, 
  Users,
  LogOut,
  Lock,
  Mail,
  Download,
  ShieldCheck,
  Zap,
  FolderUp,
  Bot,
  Settings,
  RefreshCw,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  ComposedChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// --- Advanced Mock Data ---
const generateData = () => {
  const data = [];
  let base = 15;
  for (let i = 1; i <= 20; i++) {
    base = base + (Math.random() * 4 - 2);
    data.push({
      step: i,
      loss: Math.max(0.1, 2.5 - (i * 0.1) + (Math.random() * 0.2)),
      accuracy: Math.min(99.9, 70 + (i * 1.2) + (Math.random() * 2)),
    });
  }
  return data;
};

const initialBarData = [
  { name: 'Fiber', value: 85 },
  { name: 'DSL', value: 65 },
  { name: 'Streaming', value: 45 },
  { name: 'Support', value: 30 },
  { name: 'Manual', value: 18 },
];

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<{email: string, role: string} | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const handleLogin = (newToken: string, userData: {email: string, role: string}) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthScreen onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  return <MainDashboard user={user} onLogout={handleLogout} token={token} />;
}

function MainDashboard({ user, onLogout, token }: { user: any, onLogout: () => void, token: string }) {
  const [chartData, setChartData] = useState(generateData());
  const [barData, setBarData] = useState(initialBarData);
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Initializing CHURN AI Intelligence Core...",
    "[L0_LOG] Establishing secure MPC connection...",
    "[L0_LOG] Awaiting payload injection..."
  ]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [coreActive, setCoreActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'history' | 'reports'>('chat');
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState<number | null>(null);

  const submitFeedback = async (predictionId: number, isCorrect: boolean, reason?: string) => {
    setFeedbackLoading(predictionId);
    try {
      await fetch(`${API_BASE_URL}/api/predictions/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ predictionId, isCorrect, failureReason: reason || "Correct Prediction" })
      });
      fetchPredictions(); // Refresh to show we've given feedback
    } catch (err) {
      console.error("Feedback failed:", err);
    } finally {
      setFeedbackLoading(null);
    }
  };
  const dashboardRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const exposureRef = useRef<HTMLDivElement>(null);
  const pictogramRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [fileName, setFileName] = useState("C:\\DATA\\CHURN_TELEMETRY.CSV");

  const handleCsvParsed = (data: any[], name: string) => {
    setFileName(`C:\\DATA\\${name.toUpperCase()}`);
    setLogs(prev => [
      ...prev,
      `[SYSTEM] File uploaded: ${name}`,
      `[SYSTEM] PapaParse successfully converted ${data.length} rows to JSON format.`,
      `[L0_LOG] Ready to transmit JSON payload to backend for Pandas processing...`
    ]);
  };

  // Real-time simulation
  useEffect(() => {
    if (!coreActive) return;

    const interval = setInterval(() => {
      // Update Area Chart
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastStep = prev[prev.length - 1].step;
        const lastLoss = prev[prev.length - 1].loss;
        const lastAcc = prev[prev.length - 1].accuracy;
        
        newData.push({
          step: lastStep + 1,
          loss: Math.max(0.01, lastLoss - (Math.random() * 0.05)),
          accuracy: Math.min(99.9, lastAcc + (Math.random() * 0.5)),
        });
        return newData;
      });

      // Update Bar Chart
      setBarData(prev => prev.map(item => ({
        ...item,
        value: Math.min(100, Math.max(0, item.value + (Math.random() * 4 - 2)))
      })));

      // Add Terminal Log
      setLogs(prev => {
        const newLogs = [...prev];
        if (newLogs.length > 50) newLogs.shift();
        const actions = [
          "Optimizing gradient descent matrix...",
          "Recalibrating neural weights...",
          "Anomaly detected in sector 7G. Resolving...",
          "Cross-validating user telemetry...",
          "Updating demographic exposure indices..."
        ];
        newLogs.push(`[L0_LOG_${Date.now().toString().slice(-4)}] ${actions[Math.floor(Math.random() * actions.length)]}`);
        return newLogs;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [coreActive]);

  const fetchDbLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 403 || res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setDbLogs(data);
      } else {
        console.error("Expected array for logs, got:", data);
      }
    } catch (err) {
      console.error("Failed to fetch DB logs", err);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/predictions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 403 || res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setPredictions(data);
      } else {
        console.error("Expected array for predictions, got:", data);
      }
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchDbLogs();
    if (activeTab === 'reports') fetchPredictions();
  }, [activeTab]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleIgnite = async () => {
    if (coreActive) {
      setCoreActive(false);
      return;
    }

    setCoreActive(true);
    setLogs(prev => [...prev, "[SYSTEM] INITIATING DATA INJECTION PROTOCOL..."]);
    
    // Sequence of training steps (Scripted)
    const trainingSteps = [
      "[PANDAS] Loading local telemetry from D:\\CHURN_DATASET.CSV...",
      "[NUMPY] Normalizing feature vectors for neural gradient...",
      "[SCIKIT] Training XGBoost ensemble model (Depth=8)...",
      "[DB] Syncing results with Neon PostgreSQL Asia-1...",
      "[GEMINI] Validating strategic recommendations...",
      "[SUCCESS] Intelligence Core synced. Training loop stabilized."
    ];

    let i = 0;
    const logInterval = setInterval(() => {
      if (i < trainingSteps.length) {
        setLogs(prev => [...prev, trainingSteps[i]]);
        i++;
      } else {
        clearInterval(logInterval);
        setCoreActive(false);
        setLogs(prev => [...prev, "[SYSTEM] ✓ Training Complete. AUTO-EXPORTING REPORT..."]);
        
        // Save result and export
        saveResultAndExport();
      }
    }, 3000); // 18 seconds total sequence
  };

  const saveResultAndExport = async () => {
    try {
      const mockScore = Math.floor(Math.random() * 100);
      await fetch(`${API_BASE_URL}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          customerName: `Batch_0${Math.floor(Math.random() * 100)}`,
          churnScore: mockScore,
          riskLevel: mockScore > 70 ? 'High' : mockScore > 30 ? 'Medium' : 'Low',
          inputFeatures: { monthlyBill: 120, tenure: 24 }
        })
      });
      // Trigger PDF
      generatePDF();
    } catch (err) {
      console.error(err);
      generatePDF(); // Export anyway
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    setLogs(prev => [...prev, `[SYSTEM] Generating PRO Strategic Report...`]);
    
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // --- PAGE 1: COVER PAGE ---
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(1);
      pdf.line(margin, 40, pageWidth - margin, 40);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.text("CHURN", margin, 65);
      pdf.setTextColor(245, 158, 11);
      pdf.text("AI", margin + 55, 65);
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(14);
      pdf.text("STRATEGIC RETENTION MISSION REPORT", margin, 85);
      pdf.text("STRICTLY CONFIDENTIAL // COMMAND LEVEL", margin, 95);
      pdf.setFontSize(10);
      pdf.text(`REPORT_ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, margin, 150);
      pdf.text(`OPERATIVE: ${user?.email}`, margin, 155);
      pdf.text(`TIMESTAMP: ${new Date().toLocaleString()}`, margin, 160);
      pdf.setDrawColor(34, 34, 34);
      pdf.line(margin, 250, pageWidth - margin, 250);
      pdf.text("POWERED BY NOVA INTELLIGENCE CORE", pageWidth / 2, 270, { align: 'center' });

      // --- PAGE 2: EXECUTIVE METRICS ---
      pdf.addPage();
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.setFontSize(18);
      pdf.text("01 // EXECUTIVE METRICS SUMMARY", margin, 25);
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 30, 80, 30);
      const metrics = [
        { label: "TOTAL TELEMETRY ANALYZED", value: "2,450 ROWS" },
        { label: "CORE TRAINING ACCURACY", value: `${chartData[chartData.length - 1].accuracy.toFixed(1)}%` },
        { label: "HIGH RISK CLUSTER COUNT", value: predictions.filter(p => p.risk_level === 'High').length.toString() },
        { label: "ACTIVE AGENT SWARM STATUS", value: "STABILIZED" }
      ];
      metrics.forEach((m, i) => {
        const y = 50 + (i * 35);
        pdf.setFillColor(25, 25, 25);
        pdf.roundedRect(margin, y, pageWidth - (margin * 2), 25, 2, 2, 'F');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.text(m.label, margin + 5, y + 8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.text(m.value, margin + 5, y + 18);
      });

      // --- PAGE 3: PICTOGRAPHIC INTELLIGENCE (NEW) ---
      pdf.addPage();
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.setFontSize(18);
      pdf.text("02 // POPULATION CHURN DYNAMICS", margin, 25);
      
      if (pictogramRef.current && reasonsRef.current) {
        document.body.classList.add('pdf-export-mode');
        const picCanvas = await html2canvas(pictogramRef.current, { backgroundColor: '#111', scale: 2 });
        const resCanvas = await html2canvas(reasonsRef.current, { backgroundColor: '#111', scale: 2 });
        document.body.classList.remove('pdf-export-mode');

        const pImg = picCanvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(pImg, 'JPEG', margin, 40, pageWidth - (margin * 2), 80);
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.text("FIG 2.1: ISOTYPIC RATIO OF RETAINED VS CHURNED OPERATIVES", margin, 125);

        const rImg = resCanvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(rImg, 'JPEG', margin, 140, pageWidth - (margin * 2), 100);
        pdf.text("FIG 2.2: CATEGORICAL CHURN ATTRIBUTION MATRIX", margin, 245);
      }

      // --- PAGE 4: VISUAL ANALYTICS ---
      pdf.addPage();
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.setFontSize(18);
      pdf.text("03 // NEURAL GRADIENT ANALYTICS", margin, 25);

      if (matrixRef.current && exposureRef.current) {
        document.body.classList.add('pdf-export-mode');
        const matrixCanvas = await html2canvas(matrixRef.current, { backgroundColor: '#111', scale: 2 });
        const exposureCanvas = await html2canvas(exposureRef.current, { backgroundColor: '#111', scale: 2 });
        document.body.classList.remove('pdf-export-mode');
        const mImg = matrixCanvas.toDataURL('image/jpeg', 0.9);
        const eImg = exposureCanvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(mImg, 'JPEG', margin, 40, pageWidth - (margin * 2), 80);
        pdf.addImage(eImg, 'JPEG', margin, 140, pageWidth - (margin * 2), 80);
      }

      // --- PAGE 5: STRATEGIC ROADMAP ---
      pdf.addPage();
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.setFontSize(18);
      pdf.text("04 // STRATEGIC INTERVENTION ROADMAP", margin, 25);
      let aiSummary = "Intelligence core offline during capture.";
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/ai-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ data: predictions.slice(0, 5) })
        });
        const data = await res.json();
        aiSummary = data.summary || aiSummary;
      } catch (e) { console.log(e); }
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(11);
      const splitLines = pdf.splitTextToSize(aiSummary.replace(/[#*`]/g, ''), pageWidth - (margin * 2));
      pdf.text(splitLines, margin, 50);
      pdf.setTextColor(150, 50, 50);
      pdf.setFontSize(8);
      pdf.text("LEGAL NOTICE: Strategic actions should be cross-validated with human oversight.", margin, 280);

      pdf.save(`CHURN_AI_STRATEGIC_REPORT_${Date.now()}.pdf`);
      setLogs(prev => [...prev, `[SYSTEM] ✓ PRO Comprehensive Report exported.`]);
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `[ERROR] Report generation failed: ${err.message}`]);
    } finally {
      setIsGeneratingPDF(false);
      document.body.classList.remove('pdf-export-mode');
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#a3a3a3] font-mono selection:bg-amber-500/30 flex flex-col overflow-hidden">
      
      {/* Top Header */}
      <header className="shrink-0 p-4 pb-0">
        <div className="max-w-[1600px] mx-auto bg-[#111] border-2 border-[#222] rounded-md p-4 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Decorative corner cuts */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500" />
          
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded bg-amber-500/10 border border-amber-500/50 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] text-amber-500/70 tracking-[0.2em] mb-1 uppercase">
                COMMANDER: {user?.email.split('@')[0].toUpperCase()} | MISSION_RANK: {user?.role === 'admin' ? 'ADMIN' : 'OPERATIVE'}
              </div>
              <h1 className="text-3xl font-black text-white tracking-widest italic">CHURN <span className="text-amber-500">AI</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={generatePDF} disabled={isGeneratingPDF} className="text-xs text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> {isGeneratingPDF ? 'EXPORTING...' : 'EXPORT REPORT'}
            </button>
            <div className="flex items-center gap-3 bg-[#000] border border-[#333] px-4 py-2 rounded">
              <div className={cn("w-3 h-3 rounded-full", coreActive ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" : "bg-amber-500 shadow-[0_0_10px_#f59e0b]")} />
              <span className="text-sm font-bold text-white tracking-widest">{coreActive ? 'ACTIVE' : 'IDLE'}</span>
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-rose-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="shrink-0 p-4 pb-0">
        <div className="max-w-[1600px] mx-auto bg-[#111] border border-[#222] rounded-md p-2 flex items-center gap-2 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <div className="flex-1 bg-[#000] border border-[#333] rounded px-4 py-3 flex items-center gap-3">
            <FolderUp className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500">MANUAL_OVERRIDE:</span>
            <input type="text" readOnly value={fileName} className="bg-transparent border-none outline-none text-amber-500/80 text-xs w-full font-mono" />
          </div>
          <CsvUploadButton token={token} onParsed={handleCsvParsed} />
          <button 
            onClick={handleIgnite}
            className={cn(
              "px-8 py-3 rounded font-bold text-sm tracking-widest flex items-center gap-2 transition-all border",
              coreActive 
                ? "bg-rose-500/10 text-rose-500 border-rose-500/50 hover:bg-rose-500/20" 
                : "bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            )}
          >
            <Zap className="w-4 h-4" />
            {coreActive ? 'HALT CORE' : 'IGNITE CORE'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 flex gap-4 min-h-0 overflow-hidden dashboard-container" ref={dashboardRef}>
        
        {/* Left Column (Charts & Terminal) */}
        <div className="flex-[3] flex flex-col gap-4 min-h-0">
          
          {/* Top Row of Left Column */}
          <div className="flex-[2] flex gap-4 min-h-0">
            
            {/* Area Chart */}
            <div className="flex-[2] bg-[#111] border border-[#222] rounded-md p-4 flex flex-col relative" ref={matrixRef}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
              <h3 className="text-xs font-bold text-amber-500 tracking-widest mb-4 flex items-center gap-2 uppercase">
                <Activity className="w-4 h-4" /> Solar Gradient Descent Matrix
              </h3>
              <div className="flex-1 w-full min-h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#333" vertical={false} />
                    <XAxis dataKey="step" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '2px' }} />
                    <Area type="monotone" dataKey="loss" stroke="#f59e0b" strokeWidth={2} fill="url(#colorLoss)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats & Bar Chart */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="h-24 bg-[#111] border border-[#222] rounded-md p-3 flex items-center justify-between relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 -mr-6 -mt-6 rounded-full blur-xl group-hover:bg-amber-500/10" />
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <div className="text-[10px] text-zinc-500 tracking-widest uppercase">Efficiency</div>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {chartData[chartData.length - 1].accuracy.toFixed(1)}<span className="text-sm text-amber-500">%</span>
                  </div>
                </div>

                <div className="flex-1 bg-[#111] border border-[#222] rounded-md p-4 flex flex-col" ref={exposureRef}>
                  <h3 className="text-[10px] font-bold text-amber-500 tracking-widest mb-4 uppercase flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Sector Exposure Archive
                  </h3>
                  <div className="flex-1 w-full min-h-[140px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#222" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#555" fontSize={9} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{fill: '#111'}} 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: '10px' }} 
                        />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={14}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#333'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>

          </div>

          {/* Terminal Console (Bottom Left) */}
          <div className="flex-1 bg-[#000] border border-[#333] rounded-md flex flex-col overflow-hidden relative">
            <div className="px-4 py-2 border-b border-[#333] flex items-center justify-between bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Nova AI Console</h3>
              </div>
              <div className="text-[10px] text-emerald-500 animate-pulse">L0_SYS VERIFIED</div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "leading-relaxed",
                  log.includes('Anomaly') ? "text-rose-500" : 
                  log.includes('SYSTEM') ? "text-emerald-400" : 
                  "text-amber-500/80"
                )}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

        {/* Right Column (Chat Board / Logic Swarm / Agent Hub) */}
        <div className="flex-1 bg-[#111] border border-amber-500/30 rounded-md flex flex-col overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.1)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          
          {/* Tabs */}
          <div className="flex border-b border-[#222] bg-[#0a0a0a]">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn("flex-1 p-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors", activeTab === 'chat' ? "text-amber-500 border-b-2 border-amber-500 bg-[#111]" : "text-[#666] hover:text-[#999]")}
            >
              <BrainCircuit className="w-4 h-4" /> Logic Swarm
            </button>
            <button 
              onClick={() => setActiveTab('agents')}
              className={cn("flex-1 p-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors", activeTab === 'agents' ? "text-amber-500 border-b-2 border-amber-500 bg-[#111]" : "text-[#666] hover:text-[#999]")}
            >
              <Bot className="w-4 h-4" /> Agent Hub
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn("flex-1 p-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors", activeTab === 'history' ? "text-amber-500 border-b-2 border-amber-500 bg-[#111]" : "text-[#666] hover:text-[#999]")}
            >
              <Activity className="w-4 h-4" /> History
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={cn("flex-1 p-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors", activeTab === 'reports' ? "text-amber-500 border-b-2 border-amber-500 bg-[#111]" : "text-[#666] hover:text-[#999]")}
            >
              <FileText className="w-4 h-4" /> Reports Hub
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' && <ChatInterface token={token} />}
            {activeTab === 'agents' && <AgentHub />}
            {activeTab === 'history' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0a0a0a]">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-amber-500 tracking-widest uppercase flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System Audit Logs
                  </h4>
                  <button onClick={fetchDbLogs} className="p-1 hover:text-amber-500 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                {dbLogs.length === 0 ? (
                  <p className="text-[#444] text-center py-8 italic text-xs">No database records found.</p>
                ) : (
                  dbLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-[#111] border border-[#222] rounded flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-amber-500 text-[10px] font-bold tracking-widest uppercase">{log.action_type}</div>
                          {user?.role === 'admin' && (
                            <div className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500/50 rounded border border-amber-500/10">
                              {log.email}
                            </div>
                          )}
                        </div>
                        <div className="text-zinc-400 text-xs font-mono">{log.details}</div>
                      </div>
                      <div className="text-[#444] text-[9px] font-mono whitespace-nowrap ml-4">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0a0a0a]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-amber-500 tracking-[0.3em] uppercase flex items-center gap-3">
                    <BarChart className="w-4 h-4" /> Intelligence Infographics
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={fetchPredictions} className="p-2 hover:text-amber-500 transition-colors bg-[#111] rounded border border-[#222]">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Infographic 1: Pictogram Ratio (Inspired by Image 1) */}
                <div className="bg-[#111] border border-[#222] rounded-lg p-6 relative overflow-hidden group" ref={pictogramRef}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                      <h5 className="text-white font-black text-2xl mb-2 italic uppercase">Retention Ratio</h5>
                      <p className="text-[#666] text-xs uppercase tracking-widest mb-6">Based on active cohort analysis</p>
                      <div className="grid grid-cols-10 gap-2 max-w-[300px]">
                        {[...Array(50)].map((_, i) => (
                          <Users key={i} className={cn("w-4 h-4", i < 42 ? "text-amber-500" : "text-rose-500/30")} />
                        ))}
                      </div>
                      <div className="mt-6 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-amber-500">8 out of 10</span>
                        <span className="text-[#666] text-sm italic">stay loyal</span>
                      </div>
                    </div>
                    <div className="w-px h-32 bg-[#222] hidden md:block" />
                    <div className="flex flex-col gap-4">
                      <div className="text-right">
                        <div className="text-amber-500 font-bold text-3xl">84%</div>
                        <div className="text-[#444] text-[10px] uppercase">Retained (Active)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-rose-500 font-bold text-3xl">16%</div>
                        <div className="text-[#444] text-[10px] uppercase">Churn Risk (At-Risk)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infographic 2: Churn Reasons (Inspired by Image 2) */}
                <div className="bg-[#111] border border-[#222] rounded-lg p-6" ref={reasonsRef}>
                  <h5 className="text-white font-black text-lg mb-6 tracking-widest uppercase italic border-l-4 border-amber-500 pl-4">Primary Churn Drivers</h5>
                  <div className="space-y-6">
                    {[
                      { label: 'COMPETITOR PRICING', value: 78, color: 'bg-amber-500' },
                      { label: 'SUPPORT LATENCY', value: 64, color: 'bg-amber-500/60' },
                      { label: 'TECHNICAL OUTAGES', value: 45, color: 'bg-amber-500/40' },
                      { label: 'VALUE PERCEPTION', value: 32, color: 'bg-[#333]' },
                      { label: 'RELOCATION', value: 12, color: 'bg-[#222]' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold tracking-tighter">
                          <span className="text-zinc-500 uppercase">{item.label}</span>
                          <span className="text-amber-500">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-[#000] rounded-full overflow-hidden flex shadow-inner">
                          <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prediction Archive List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictions.length === 0 ? (
                    <div className="col-span-full text-center py-12 border border-dashed border-[#222] rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-[#222] mx-auto mb-2" />
                      <p className="text-[#444] italic text-[10px] tracking-widest uppercase">Awaiting initial telemetry ingestion from Asia core.</p>
                    </div>
                  ) : (
                    predictions.map((pred: any) => (
                      <div key={pred.id} className="bg-[#111] border border-[#222] rounded-md p-4 relative overflow-hidden group hover:border-amber-500/50 transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/5 to-transparent -mr-8 -mt-8 rounded-full" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                            <div className="text-[10px] text-zinc-500 font-mono mb-1">{pred.customer_name}</div>
                            <div className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest inline-block border", 
                              pred.risk_level === 'High' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                              pred.risk_level === 'Medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                              {pred.risk_level}_RISK
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5 z-10">
                          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                            <span>CHURN_PROBABILITY</span>
                            <span>{pred.churn_score}%</span>
                          </div>
                          <div className="w-full h-1 bg-[#000] rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all duration-1000", 
                                pred.risk_level === 'High' ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : 
                                pred.risk_level === 'Medium' ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]" : 
                                "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                              )} 
                              style={{ width: `${pred.churn_score}%` }} 
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-[#222] z-10">
                          <div className="flex justify-between items-center bg-black/40 p-1.5 rounded">
                            <span className="text-[9px] text-[#444] font-mono tracking-tighter italic">AI_ACCURACY_CHECK</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => submitFeedback(pred.id, true)} 
                                disabled={feedbackLoading === pred.id}
                                className="p-1 text-emerald-500/50 hover:text-emerald-400 transition-colors"
                                title="Mark as Correct"
                              >
                                <CheckCircle className={cn("w-4 h-4", feedbackLoading === pred.id ? "animate-pulse" : "")} />
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt("Describe the mistake (e.g. data was outdated, wrong reasoning):");
                                  if (reason) submitFeedback(pred.id, false, reason);
                                }} 
                                disabled={feedbackLoading === pred.id}
                                className="p-1 text-rose-500/50 hover:text-rose-500 transition-colors"
                                title="Mark as Incorrect"
                              >
                                <XCircle className={cn("w-4 h-4", feedbackLoading === pred.id ? "animate-pulse" : "")} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-[#444] font-mono">
                            <span>{new Date(pred.created_at).toLocaleString()}</span>
                            {user?.role === 'admin' && (
                              <span className="text-amber-500/40 uppercase font-black">{pred.email.split('@')[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

// --- Auth Screen (PRO Version) ---
function AuthScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      onLogin(data.token, data.user);
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Google Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-[#111] border border-[#333] rounded-md p-8 relative shadow-[0_0_30px_rgba(245,158,11,0.1)]">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500" />
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            <Cpu className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-white text-center mb-1 tracking-widest italic">
          CHURN <span className="text-amber-500">AI</span>
        </h2>
        <p className="text-[#666] text-center text-[10px] tracking-[0.3em] mb-12 uppercase">
          Nexus Command Authorization
        </p>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 rounded">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-6 flex flex-col items-center">
          <div className="w-full border-t border-[#222] relative my-4">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111] px-4 text-[10px] text-[#444] tracking-widest uppercase">
              Secure Gateway
            </span>
          </div>

          <div className="w-full flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-[10px] text-amber-500 animate-pulse tracking-widest uppercase">Verifying Identity...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                theme="outline"
                shape="rectangular"
                width="100%"
                text="continue_with"
                useOneTap
              />
            )}
          </div>

          <div className="mt-8 text-center px-4">
            <p className="text-[9px] text-[#555] leading-relaxed uppercase tracking-tighter">
              By initiating link, you agree to comply with NOVA Command's protocol and data encryption standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Chat Interface ---
function ChatInterface({ token }: { token: string }) {
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Logic Swarm active. Awaiting data integration queries or device advice.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      if (res.status === 403 || res.status === 401) {
        // Find the MainDashboard's onLogout if we can, or just clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'agent', content: `**[SYSTEM_ERROR]** ${data.error || 'Failed to process signal.'}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', content: data.reply }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', content: '**[CONNECTION_LOST]** Server not responding. Verify core status.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-[#0a0a0a]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 mt-1", msg.role === 'agent' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "bg-[#222] text-[#888] border border-[#333]")}>
              {msg.role === 'agent' ? <Cpu className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            </div>
            <div className={cn("p-3 rounded text-xs leading-relaxed font-mono", msg.role === 'agent' ? "bg-[#111] border border-[#333] text-[#ccc]" : "bg-amber-500/10 border border-amber-500/30 text-amber-500")}>
              {msg.role === 'agent' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#000] prose-pre:border prose-pre:border-[#333] prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-strong:text-amber-500">
                  <Markdown>{msg.content}</Markdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[90%]">
            <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
              <Cpu className="w-3 h-3" />
            </div>
            <div className="p-3 rounded bg-[#111] border border-[#333] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#222] bg-[#111] shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="> Input query..."
            className="flex-1 bg-[#000] border border-[#333] rounded px-3 py-2 text-xs text-amber-500 font-mono focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-[#555]"
          />
          <button type="submit" disabled={!input.trim() || loading} className="p-2 rounded bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

const SwarmFlow = () => {
  return (
    <div className="relative h-64 w-full bg-[#111] border-2 border-amber-500/50 rounded-xl overflow-hidden mb-8 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Central Intelligence Core */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="h-16 w-16 rounded-full border-2 border-amber-500 bg-black flex items-center justify-center relative shadow-[0_0_15px_#f59e0b50]">
            <Cpu className="h-8 w-8 text-amber-500" />
            <div className="absolute -inset-2 border border-amber-500/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
          </div>
        </div>
      </div>

      {/* Retention Agent Node */}
      <div className="absolute top-12 left-12 z-30 animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center shadow-[0_0_10px_#3b82f640] backdrop-blur-sm">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-400 font-bold font-mono tracking-widest bg-black/50 px-2 py-0.5 rounded">RETENTION_AGENT</span>
        </div>
      </div>

      {/* Manager Agent Node */}
      <div className="absolute bottom-12 right-12 z-30 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_10px_#10b98140] backdrop-blur-sm">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold font-mono tracking-widest bg-black/50 px-2 py-0.5 rounded">MANAGER_AGENT</span>
        </div>
      </div>

      {/* Neural Links */}
      <svg className="absolute inset-0 h-full w-full opacity-40">
        <line x1="20%" y1="25%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]" />
        <line x1="80%" y1="75%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]" />
      </svg>
      
      <div className="absolute bottom-4 left-6 flex items-center gap-3">
        <div className="flex gap-1">
          <div className="h-1 w-3 bg-emerald-500 animate-pulse"></div>
          <div className="h-1 w-3 bg-emerald-500/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-1 w-3 bg-emerald-500/20 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] italic">Intelligence Swarm: Optimized</span>
      </div>
    </div>
  );
};

// --- Agent Hub Interface ---
function AgentHub() {
  const [managerLogs, setManagerLogs] = useState<string[]>([]);
  const [learningLogs, setLearningLogs] = useState<string[]>([]);
  const [isManagerRunning, setIsManagerRunning] = useState(false);
  const [isLearningRunning, setIsLearningRunning] = useState(false);

  const runManagerAgent = () => {
    if (isManagerRunning) return;
    setIsManagerRunning(true);
    setManagerLogs(["[CRON] Weekly trigger activated..."]);
    
    const steps = [
      "[DB] Fetching weekly churn metrics...",
      "[PUPPETEER] Rendering dashboard headless...",
      "[PUPPETEER] Generating PDF report...",
      "[LANGCHAIN] Passing data to Gemini for summary...",
      "[GEMINI] 'Overall churn reduced by 2.4%. High risk in Retail sector.'",
      "[TWILIO] Sending WhatsApp alert to CEO...",
      "[SYSTEM] Manager Agent task completed successfully."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setManagerLogs(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsManagerRunning(false);
      }
    }, 1000);
  };

  const runLearningAgent = () => {
    if (isLearningRunning) return;
    setIsLearningRunning(true);
    setLearningLogs(["[SYSTEM] Initiating Self-Correction Loop..."]);
    
    const steps = [
      "[DB] Analyzing past 100 automated emails...",
      "[LANGCHAIN] Evaluating customer responses...",
      "[ALERT] Detected 40% failure rate with '10% discount' offer.",
      "[GEMINI] Suggesting new strategy: 'Free 1 Month Trial + Call'.",
      "[DB] Updating Agent memory and email templates...",
      "[SYSTEM] Strategy updated. Learning loop closed."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setLearningLogs(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsLearningRunning(false);
      }
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] p-4 gap-4 overflow-y-auto">
      <SwarmFlow />
      
      {/* Manager Agent */}
      <div className="bg-[#111] border border-[#333] rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-widest uppercase">Manager Agent</h4>
              <p className="text-[10px] text-[#666]">Auto-Reporting (Cron, Puppeteer, Twilio)</p>
            </div>
          </div>
          <button 
            onClick={runManagerAgent}
            disabled={isManagerRunning}
            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isManagerRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {isManagerRunning ? 'RUNNING...' : 'FORCE RUN'}
          </button>
        </div>
        <div className="bg-[#000] border border-[#222] rounded p-3 h-32 overflow-y-auto font-mono text-[10px] space-y-1">
          {managerLogs.length === 0 && <div className="text-[#444]">Agent Idle. Waiting for Friday 5:00 PM...</div>}
          {managerLogs.map((log, i) => (
            <div key={i} className={log.includes('completed') ? "text-emerald-500" : "text-[#888]"}>{log}</div>
          ))}
        </div>
      </div>

      {/* Self-Correction Agent */}
      <div className="bg-[#111] border border-[#333] rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-500" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-widest uppercase">Self-Correction Agent</h4>
              <p className="text-[10px] text-[#666]">Learning Loop (LangChain, Memory)</p>
            </div>
          </div>
          <button 
            onClick={runLearningAgent}
            disabled={isLearningRunning}
            className="px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded text-xs font-bold hover:bg-rose-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLearningRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {isLearningRunning ? 'LEARNING...' : 'SIMULATE LOOP'}
          </button>
        </div>
        <div className="bg-[#000] border border-[#222] rounded p-3 h-32 overflow-y-auto font-mono text-[10px] space-y-1">
          {learningLogs.length === 0 && <div className="text-[#444]">Agent Idle. Monitoring email success rates...</div>}
          {learningLogs.map((log, i) => (
            <div key={i} className={log.includes('ALERT') ? "text-amber-500" : log.includes('closed') ? "text-rose-500" : "text-[#888]"}>{log}</div>
          ))}
        </div>
      </div>

    </div>
  );
}

// --- CSV Upload Button ---
function CsvUploadButton({ token, onParsed }: { token: string, onParsed: (data: any[], fileName: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("Parsed JSON Data:", results.data);
          onParsed(results.data, file.name);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#222] hover:bg-[#333] text-amber-500 border border-[#444] rounded text-[10px] font-bold tracking-widest transition-colors uppercase">
        PAYLOAD SELECTOR
      </button>
    </>
  );
}
