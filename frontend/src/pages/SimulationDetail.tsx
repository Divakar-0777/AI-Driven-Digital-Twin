import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface SimulationData {
  id: string;
  decision: any;
  baseline: any;
  scenarios: any;
  assumptions: any;
  outcomes: any;
  comparison: any;
  recommendation: any;
  createdAt: string;
}

export const SimulationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sim, setSim] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSim = async () => {
      try {
        const res = await api.get(`/decision-simulations/${id}`);
        setSim(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (id) fetchSim();
  }, [id]);

  const parseJSON = (val: any) => {
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return {}; } }
    return val || {};
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24 }}>Loading Simulation...</div>
        </div>
      </div>
    );
  }

  if (!sim) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 260, padding: 40, textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: 60 }}>
            <h3 style={{ color: 'var(--text-highlight)' }}>Simulation not found</h3>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/simulations')}>Back to Simulations</button>
          </div>
        </div>
      </div>
    );
  }

  const decision = parseJSON(sim.decision);
  const scenarios = parseJSON(sim.scenarios);
  const comparison = parseJSON(sim.comparison);
  const recommendation = parseJSON(sim.recommendation);
  const outcomes = parseJSON(sim.outcomes);
  const assumptions = parseJSON(sim.assumptions);

  const scenarioList = Array.isArray(scenarios) ? scenarios : Object.values(scenarios);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: 40 }}>
        <button onClick={() => navigate('/simulations')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)',
          fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
        }}>
          <ArrowLeft size={16} /> Back to Simulations
        </button>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: 8 }}>
          {decision?.decisionName || 'Decision Simulation'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          {decision?.category} • {decision?.horizon} horizon • Created {new Date(sim.createdAt).toLocaleDateString()}
        </p>

        {/* Decision Details */}
        <div className="glass-panel" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>📋 Decision Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>{decision?.action}</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>{decision?.category}</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horizon</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>{decision?.horizon}</div>
            </div>
          </div>
        </div>

        {/* Scenario Comparison */}
        <div className="glass-panel" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 20 }}>📊 Scenario Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--card-border)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Metric</th>
                  {scenarioList.map((sc: any, i: number) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                      {sc.name || `Scenario ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenarioList.length > 0 && Object.keys(scenarioList[0]).filter(k => k !== 'name').map((key) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    {scenarioList.map((sc: any, i: number) => (
                      <td key={i} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: 'var(--text-highlight)' }}>
                        {typeof sc[key] === 'number' ? (sc[key] > 100 ? `$${sc[key].toLocaleString()}` : sc[key]) : sc[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk & Recommendation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>⚠️ Risk Assessment</h3>
            {scenarioList.map((sc: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sc.name || `Scenario ${i + 1}`}</span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  color: sc.risk === 'HIGH' ? 'var(--danger)' : sc.risk === 'MODERATE' ? 'var(--warning)' : 'var(--success)',
                  background: sc.risk === 'HIGH' ? 'rgba(239,68,68,0.1)' : sc.risk === 'MODERATE' ? 'rgba(217,119,6,0.1)' : 'rgba(16,185,129,0.1)',
                }}>
                  {sc.risk || 'N/A'}
                </span>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>💡 AI Recommendation</h3>
            {recommendation?.bestScenario && (
              <div style={{ padding: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>Best Option</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>{recommendation.bestScenario}</div>
              </div>
            )}
            {recommendation?.summary && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                {recommendation.summary}
              </p>
            )}
            {recommendation?.ranking && Array.isArray(recommendation.ranking) && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 8 }}>Ranking:</div>
                {recommendation.ranking.map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: 'white',
                      background: i === 0 ? 'var(--success)' : i === 1 ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-highlight)', fontWeight: 500 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assumptions */}
        {assumptions && Object.keys(assumptions).length > 0 && (
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 16 }}>📐 Assumptions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {Object.entries(assumptions).map(([key, val]) => (
                <div key={key} style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-highlight)' }}>
                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimulationDetail;
