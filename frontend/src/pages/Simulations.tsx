import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Zap, Plus, Trash2, Eye, AlertTriangle } from 'lucide-react';

interface Simulation {
  id: string;
  decision: any;
  baseline: any;
  scenarios: any;
  comparison: any;
  recommendation: any;
  createdAt: string;
}

export const Simulations: React.FC = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({
    decisionName: '', category: 'FINANCIAL', action: '',
    horizon: '6 months',
    cost: 0, parameters: '{}',
    affectedDomains: ['FINANCE', 'STUDY'],
  });

  const fetchSimulations = async () => {
    try {
      const res = await api.get('/decision-simulations');
      setSimulations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSimulations(); }, []);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRunning(true);
      const res = await api.post('/decision-simulations/run', {
        decisionName: form.decisionName,
        category: form.category,
        action: form.action,
        parameters: { cost: form.cost },
        affectedDomains: form.affectedDomains,
        horizon: form.horizon,
        selectedGoals: [],
        userPriorities: { FINANCE: 0.4, STUDY: 0.35, PRODUCTIVITY: 0.25 },
      });
      // Save the result
      await api.post('/decision-simulations', {
        decisionName: form.decisionName,
        category: form.category,
        action: form.action,
        parameters: { cost: form.cost },
        affectedDomains: form.affectedDomains,
        horizon: form.horizon,
        selectedGoals: [],
        userPriorities: { FINANCE: 0.4, STUDY: 0.35, PRODUCTIVITY: 0.25 },
      });
      setShowNew(false);
      fetchSimulations();
    } catch (err) { console.error(err); }
    finally { setRunning(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this simulation?')) return;
    try { await api.delete(`/decision-simulations/${id}`); fetchSimulations(); }
    catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Simulations...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)' }}>⚡ Simulations</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Run what-if decision simulations and compare scenarios</p>
          </div>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> New Simulation
          </button>
        </div>

        {/* New Simulation Form */}
        {showNew && (
          <div className="glass-panel" style={{ padding: 32, marginBottom: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>
              🆕 Create Decision Simulation
            </h3>
            <form onSubmit={handleRun} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="Decision Name (e.g., Buy a Laptop)" value={form.decisionName} onChange={e => setForm({ ...form, decisionName: e.target.value })} required />
              <input placeholder="Action (e.g., Purchase MacBook Pro)" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="FINANCIAL">Financial</option>
                  <option value="EDUCATION">Education</option>
                  <option value="CAREER">Career</option>
                  <option value="LIFESTYLE">Lifestyle</option>
                </select>
                <select value={form.horizon} onChange={e => setForm({ ...form, horizon: e.target.value })}>
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
                <input type="number" placeholder="Cost (if applicable)" value={form.cost || ''} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={running}>
                  {running ? 'Running...' : '🚀 Run Simulation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Simulation Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {simulations.map(sim => {
            const decision = typeof sim.decision === 'string' ? JSON.parse(sim.decision) : sim.decision;
            const scenarios = typeof sim.scenarios === 'string' ? JSON.parse(sim.scenarios) : sim.scenarios;
            const comparison = typeof sim.comparison === 'string' ? JSON.parse(sim.comparison) : sim.comparison;
            const recommendation = typeof sim.recommendation === 'string' ? JSON.parse(sim.recommendation) : sim.recommendation;

            return (
              <div key={sim.id} className="glass-panel" style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                      {decision?.decisionName || 'Decision Simulation'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {decision?.category} • {decision?.horizon} horizon • {new Date(sim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigate(`/simulations/${sim.id}`)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      <Eye size={14} /> View Details
                    </button>
                    <button onClick={() => handleDelete(sim.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Scenario Comparison Cards */}
                {Array.isArray(scenarios) && scenarios.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(scenarios.length, 3)}, 1fr)`, gap: 16, marginBottom: 16 }}>
                    {scenarios.map((sc: any, i: number) => (
                      <div key={i} style={{
                        padding: 16, borderRadius: 10, border: '1px solid var(--card-border)',
                        background: i === 0 ? 'rgba(79,70,229,0.04)' : 'rgba(0,0,0,0.02)',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                          {sc.name || `Scenario ${i + 1}`}
                        </div>
                        {sc.monthlySavings !== undefined && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Monthly Savings: <span style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>${sc.monthlySavings?.toLocaleString()}</span>
                          </div>
                        )}
                        {sc.projectedBalance6Months !== undefined && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Balance (6mo): <span style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>${sc.projectedBalance6Months?.toLocaleString()}</span>
                          </div>
                        )}
                        {sc.studyHoursPerWeek !== undefined && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Study Hrs/Wk: <span style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>{sc.studyHoursPerWeek}</span>
                          </div>
                        )}
                        {sc.risk && (
                          <div style={{
                            marginTop: 8, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            color: sc.risk === 'HIGH' ? 'var(--danger)' : sc.risk === 'MODERATE' ? 'var(--warning)' : 'var(--success)',
                            background: sc.risk === 'HIGH' ? 'rgba(239,68,68,0.1)' : sc.risk === 'MODERATE' ? 'rgba(217,119,6,0.1)' : 'rgba(16,185,129,0.1)',
                            display: 'inline-block',
                          }}>
                            Risk: {sc.risk}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                {recommendation && (
                  <div style={{ padding: 14, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--success)' }}>💡 Recommendation:</strong>{' '}
                    {recommendation.summary || recommendation.bestScenario || 'Review the scenarios above to make your decision.'}
                    {recommendation.ranking && Array.isArray(recommendation.ranking) && (
                      <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
                        <strong>Ranking:</strong> {recommendation.ranking.join(' → ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {simulations.length === 0 && (
          <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
            <Zap size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-highlight)', marginBottom: 8 }}>No Simulations Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Create a what-if simulation to compare decision outcomes</p>
            <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> Run Simulation</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Simulations;
