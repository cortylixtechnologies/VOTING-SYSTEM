/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vote, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { User, Election, Position, Candidate, VoteResult } from './types';

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-700',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
  };

  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input 
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      {...props}
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'admin' | 'voting' | 'results'>('login');
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [votedPositions, setVotedPositions] = useState<number[]>([]);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Auth States
  const [authForm, setAuthForm] = useState({ studentId: '', email: '', password: '', identifier: '' });

  useEffect(() => {
    if (user) {
      fetchElections();
    }
  }, [user]);

  const fetchElections = async () => {
    const res = await fetch('/api/elections');
    const data = await res.json();
    setElections(data);
  };

  const fetchElectionDetails = async (id: number) => {
    setLoading(true);
    const res = await fetch(`/api/elections/${id}`);
    const data = await res.json();
    setSelectedElection(data);
    
    if (user) {
      const votesRes = await fetch(`/api/user/${user.id}/votes/${id}`);
      const votesData = await votesRes.json();
      setVotedPositions(votesData);
    }
    setLoading(false);
  };

  const fetchResults = async (id: number) => {
    const res = await fetch(`/api/elections/${id}/results`);
    const data = await res.json();
    setResults(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: authForm.identifier, password: authForm.password })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setView('dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        studentId: authForm.studentId, 
        email: authForm.email, 
        password: authForm.password 
      })
    });
    if (res.ok) {
      alert('Registration successful! Please login.');
      setView('login');
    } else {
      alert('Registration failed');
    }
  };

  const handleVote = async (positionId: number, candidateId: number) => {
    if (!user || !selectedElection) return;
    
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        electionId: selectedElection.id,
        positionId,
        candidateId
      })
    });

    if (res.ok) {
      setVotedPositions([...votedPositions, positionId]);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const logout = () => {
    setUser(null);
    setView('login');
    setElections([]);
    setSelectedElection(null);
  };

  // --- Views ---

  const LoginView = () => (
    <div key="login" className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <Vote size={32} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">CampusVote</h1>
          <p className="text-zinc-500 mt-2">Secure student election portal</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="Student ID or Email" 
              placeholder="e.g. STU12345"
              value={authForm.identifier}
              onChange={e => setAuthForm({ ...authForm, identifier: e.target.value })}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full py-3">Sign In</Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
            <p className="text-sm text-zinc-500">
              Don't have an account?{' '}
              <button onClick={() => setView('register')} className="text-indigo-600 font-semibold hover:underline">Register here</button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  const RegisterView = () => (
    <div key="register" className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Create Account</h1>
          <p className="text-zinc-500 mt-2">Join the campus decision making process</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            <Input 
              label="Student ID" 
              placeholder="STU12345"
              value={authForm.studentId}
              onChange={e => setAuthForm({ ...authForm, studentId: e.target.value })}
              required
            />
            <Input 
              label="College Email" 
              type="email"
              placeholder="name@college.edu"
              value={authForm.email}
              onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={authForm.password}
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full py-3">Register</Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <button onClick={() => setView('login')} className="text-indigo-600 font-semibold hover:underline">Sign in</button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  const DashboardView = () => (
    <div key="dashboard" className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome, {user?.studentId}</h1>
          <p className="text-zinc-500">Participate in active elections</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <Button variant="outline" onClick={() => setView('admin')}>
              <Settings size={18} className="mr-2" /> Admin Panel
            </Button>
          )}
          <Button variant="ghost" onClick={logout}>
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map(election => (
          <Card key={election.id} className="group hover:border-indigo-200 transition-colors">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  election.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                )}>
                  {election.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{election.title}</h3>
              <p className="text-sm text-zinc-500 line-clamp-2 mb-6">{election.description}</p>
              
              <div className="flex items-center gap-4 mb-6 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Ends {new Date(election.end_date).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    fetchElectionDetails(election.id);
                    setView('voting');
                  }}
                >
                  Vote Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    fetchResults(election.id);
                    setSelectedElection(election);
                    setView('results');
                  }}
                >
                  <BarChart3 size={18} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {elections.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-100 text-zinc-400 mb-4">
              <Vote size={40} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">No active elections</h3>
            <p className="text-zinc-500">Check back later for upcoming campus polls.</p>
          </div>
        )}
      </div>
    </div>
  );

  const VotingView = () => {
    if (!selectedElection) return null;

    return (
      <div key="voting" className="max-w-4xl mx-auto p-6">
        <header className="mb-10">
          <button 
            onClick={() => setView('dashboard')}
            className="text-sm font-semibold text-indigo-600 hover:underline mb-4 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">{selectedElection.title}</h1>
          <p className="text-zinc-500 mt-2">{selectedElection.description}</p>
        </header>

        <div className="space-y-12">
          {selectedElection.positions?.map(position => {
            const hasVoted = votedPositions.includes(position.id);
            
            return (
              <section key={position.id} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">{position.title}</h2>
                  {hasVoted && (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                      <CheckCircle2 size={16} /> Voted
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {position.candidates.map(candidate => (
                    <Card 
                      key={candidate.id} 
                      className={cn(
                        "relative p-6 transition-all",
                        hasVoted ? "opacity-60 grayscale-[0.5]" : "hover:border-indigo-300 hover:shadow-md cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm">
                          <img 
                            src={candidate.image_url || `https://picsum.photos/seed/${candidate.name}/200/200`} 
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900">{candidate.name}</h4>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{candidate.bio}</p>
                        </div>
                      </div>
                      
                      {!hasVoted && (
                        <Button 
                          className="w-full mt-6" 
                          variant="outline"
                          onClick={() => handleVote(position.id, candidate.id)}
                        >
                          Select Candidate
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  };

  const ResultsView = () => {
    const groupedResults = results.reduce((acc, curr) => {
      if (!acc[curr.position]) acc[curr.position] = [];
      acc[curr.position].push(curr);
      return acc;
    }, {} as Record<string, VoteResult[]>);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
      <div key="results" className="max-w-5xl mx-auto p-6">
        <header className="mb-10">
          <button 
            onClick={() => setView('dashboard')}
            className="text-sm font-semibold text-indigo-600 hover:underline mb-4 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">Election Results</h1>
          <p className="text-zinc-500 mt-2">{selectedElection?.title}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(Object.entries(groupedResults) as [string, VoteResult[]][]).map(([position, data]) => (
            <Card key={position} className="p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                {position}
              </h3>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f1" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="candidate" 
                      type="category" 
                      width={100} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fontWeight: 500, fill: '#71717a' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={24}>
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-3">
                {[...data].sort((a, b) => b.votes - a.votes).map((item, i) => (
                  <div key={item.candidate} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        i === 0 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"
                      )}>
                        {i + 1}
                      </span>
                      <span className="font-medium text-zinc-700">{item.candidate}</span>
                    </div>
                    <span className="font-bold text-zinc-900">{item.votes} votes</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const AdminView = () => {
    const [newElection, setNewElection] = useState({ title: '', description: '', startDate: '', endDate: '' });
    const [activeTab, setActiveTab] = useState<'elections' | 'users'>('elections');

    const handleCreateElection = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newElection)
      });
      if (res.ok) {
        alert('Election created!');
        fetchElections();
        setNewElection({ title: '', description: '', startDate: '', endDate: '' });
      }
    };

    return (
      <div key="admin" className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Admin Control Center</h1>
            <p className="text-zinc-500">Manage elections and candidates</p>
          </div>
          <Button variant="outline" onClick={() => setView('dashboard')}>
            Exit Admin
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-6">Create New Election</h3>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <Input 
                  label="Election Title" 
                  value={newElection.title}
                  onChange={e => setNewElection({ ...newElection, title: e.target.value })}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px]"
                    value={newElection.description}
                    onChange={e => setNewElection({ ...newElection, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Start Date" 
                    type="date"
                    value={newElection.startDate}
                    onChange={e => setNewElection({ ...newElection, startDate: e.target.value })}
                    required
                  />
                  <Input 
                    label="End Date" 
                    type="date"
                    value={newElection.endDate}
                    onChange={e => setNewElection({ ...newElection, endDate: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-4">Create Election</Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4 p-1 bg-zinc-100 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab('elections')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === 'elections' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Elections
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === 'users' ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Users
              </button>
            </div>

            {activeTab === 'elections' ? (
              <div className="space-y-4">
                {elections.map(election => (
                  <Card key={election.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-zinc-900">{election.title}</h4>
                        <p className="text-sm text-zinc-500">{election.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          fetchElectionDetails(election.id);
                          setView('voting'); // Reuse voting view for management
                        }}>
                          Manage Positions
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center text-zinc-500">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>User management coming soon.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <AnimatePresence mode="wait">
        {view === 'login' && LoginView()}
        {view === 'register' && RegisterView()}
        {view === 'dashboard' && DashboardView()}
        {view === 'admin' && AdminView()}
        {view === 'voting' && VotingView()}
        {view === 'results' && ResultsView()}
      </AnimatePresence>
    </div>
  );
}
