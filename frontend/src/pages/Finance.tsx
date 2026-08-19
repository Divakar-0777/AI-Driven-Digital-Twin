import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Plus, Edit2, Trash2, Calendar, Tag, CreditCard, X, Upload, Download } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
  recurring: boolean;
  recurrenceFrequency?: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  monthlyExpenseTarget: number;
  expenseVsTargetStatus: string;
}

interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currentSpending: number;
  period: string;
  status: string;
}

interface Goal {
  id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  goalCategory: string;
  status: string;
  progress?: number;
  remaining?: number;
}

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [showTxModal, setShowTxModal] = useState(false);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [txAmount, setTxAmount] = useState(0);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txPaymentMethod, setTxPaymentMethod] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txRecurring, setTxRecurring] = useState(false);
  const [txRecurrence, setTxRecurrence] = useState('MONTHLY');

  // Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState(0);

  // Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalCurrent, setGoalCurrent] = useState(0);
  const [goalContribution, setGoalContribution] = useState(0);
  const [goalDate, setGoalDate] = useState('');
  const [goalPriority, setGoalPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [goalCategoryField, setGoalCategoryField] = useState('Emergency Fund');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txRes, summaryRes, budgetRes, goalRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary'),
        api.get('/finance/budgets'),
        api.get('/finance/goals'),
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
      setBudgets(budgetRes.data);
      setGoals(goalRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch financial datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Filter & Sort Logic
  const categoriesList = Array.from(new Set(transactions.map(t => t.category)));

  const filteredTransactions = transactions
    .filter(tx => {
      const matchSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || tx.type === filterType;
      const matchCategory = filterCategory === 'ALL' || tx.category === filterCategory;
      return matchSearch && matchType && matchCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Transaction CRUD triggers
  const openAddTxModal = () => {
    setIsEditingTx(false);
    setCurrentTxId(null);
    setTxTitle('');
    setTxCategory('');
    setTxType('EXPENSE');
    setTxAmount(0);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxPaymentMethod('');
    setTxNotes('');
    setTxRecurring(false);
    setTxRecurrence('MONTHLY');
    setShowTxModal(true);
  };

  const openEditTxModal = (tx: Transaction) => {
    setIsEditingTx(true);
    setCurrentTxId(tx.id);
    setTxTitle(tx.title);
    setTxCategory(tx.category);
    setTxType(tx.type);
    setTxAmount(Number(tx.amount));
    setTxDate(new Date(tx.date).toISOString().split('T')[0]);
    setTxPaymentMethod(tx.paymentMethod);
    setTxNotes(tx.notes || '');
    setTxRecurring(tx.recurring || false);
    setTxRecurrence(tx.recurrenceFrequency || 'MONTHLY');
    setShowTxModal(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    const payload = {
      title: txTitle,
      category: txCategory,
      type: txType,
      amount: Number(txAmount),
      date: new Date(txDate).toISOString(),
      paymentMethod: txPaymentMethod,
      notes: txNotes || null,
      recurring: txRecurring,
      recurrenceFrequency: txRecurring ? txRecurrence : null,
    };

    try {
      if (isEditingTx && currentTxId) {
        await api.put(`/transactions/${currentTxId}`, payload);
        showFeedback('Transaction updated successfully');
      } else {
        await api.post('/transactions', payload);
        showFeedback('Transaction recorded');
      }
      setShowTxModal(false);
      fetchFinanceData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    }
  };

  const handleTxDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      showFeedback('Transaction deleted');
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to delete transaction.');
    }
  };

  // Budget Actions
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetLimit <= 0) {
      setError('Limit must be greater than zero');
      return;
    }
    try {
      await api.post('/finance/budgets', {
        category: budgetCategory,
        monthlyLimit: Number(budgetLimit),
      });
      showFeedback('Budget updated');
      setShowBudgetModal(false);
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to create category budget.');
    }
  };

  const handleBudgetDelete = async (id: string) => {
    if (!window.confirm('Remove this category limit?')) return;
    try {
      await api.delete(`/finance/budgets/${id}`);
      showFeedback('Category limit removed');
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to delete budget.');
    }
  };

  // Goal Actions
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTarget <= 0) {
      setError('Target must be greater than zero');
      return;
    }
    try {
      await api.post('/finance/goals', {
        goalName,
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalCurrent),
        monthlyContribution: Number(goalContribution),
        targetDate: new Date(goalDate).toISOString(),
        priority: goalPriority,
        goalCategory: goalCategoryField,
      });
      showFeedback('Savings goal created');
      setShowGoalModal(false);
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to create savings goal.');
    }
  };

  const handleGoalDelete = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.delete(`/finance/goals/${id}`);
      showFeedback('Goal removed');
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to delete goal.');
    }
  };

  // CSV Import/Export
  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const csvText = evt.target?.result as string;
      try {
        const res = await api.post('/transactions/import', { csvText });
        showFeedback(res.data.message || 'CSV imported successfully!');
        fetchFinanceData();
      } catch (err: any) {
        setError(err.response?.data?.error || 'CSV import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    window.open(`${api.defaults.baseURL}/transactions/export?format=csv`, '_blank');
  };

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#f8fafc' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              AI Financial Digital Twin
            </h2>
            <p style={{ color: '#94a3b8', marginTop: '4px' }}>
              Log income, budgets, target savings goals, and audit categories with ML time-series predictions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="file" ref={fileInputRef} onChange={handleCsvImport} accept=".csv" style={{ display: 'none' }} />
            <button onClick={triggerImport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Upload size={16} /> Import CSV
            </button>
            <button onClick={handleCsvExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <Download size={16} /> Export CSV
            </button>
            <button id="btn-add-transaction" onClick={openAddTxModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px var(--primary-glow)' }}>
              <Plus size={18} /> Add Transaction
            </button>
          </div>
        </div>

        {/* Success / Error Feedbacks */}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Financial Summaries Grid */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Monthly Income</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                +${summary.totalIncome.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Expenses</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>
                -${summary.totalExpense.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Monthly Savings</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1', marginTop: '6px' }}>
                ${summary.netSavings.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.3)', border: summary.expenseVsTargetStatus === 'OVER_BUDGET' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Profile Expense Budget</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: summary.expenseVsTargetStatus === 'OVER_BUDGET' ? '#ef4444' : '#10b981', marginTop: '6px' }}>
                {summary.expenseVsTargetStatus === 'OVER_BUDGET' ? 'OVER BUDGET' : 'ON TARGET'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target limit: ${summary.monthlyExpenseTarget.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          
          {/* Left Column: Transaction Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Filter controls panel */}
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(30, 27, 75, 0.2)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <input
                  type="text"
                  placeholder="Search title, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              <div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expense Only</option>
                </select>
              </div>

              <div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                  <option value="ALL">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>

              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer' }}
              >
                {sortOrder === 'desc' ? '▼ Desc' : '▲ Asc'}
              </button>
            </div>

            {/* Transactions Table */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.2)', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Transaction History</h3>

              {loading ? (
                <div style={{ color: '#94a3b8' }}>Syncing ledger...</div>
              ) : filteredTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                  No transactions recorded matching filters.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px' }}>Title</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Category</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Method</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#cbd5e1' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'white' }}>
                          {tx.title}
                          {tx.recurring && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                              🔄 {tx.recurrenceFrequency}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: tx.type === 'INCOME' ? '#10b981' : '#f87171'
                          }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={13} /> {tx.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 700, color: tx.type === 'INCOME' ? '#10b981' : 'white' }}>
                          {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '16px', color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CreditCard size={13} /> {tx.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} /> {new Date(tx.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => openEditTxModal(tx)} style={{ background: 'transparent', border: 'none', color: '#6366f1', padding: 0, cursor: 'pointer' }}>
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => handleTxDelete(tx.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', padding: 0, cursor: 'pointer' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* Right Column: Budgets & Goals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Budgets Tracker Panel */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Category Budgets</h3>
                <button onClick={() => setShowBudgetModal(true)} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  + Set Limit
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {budgets.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>No category budgets set.</div>
                ) : (
                  budgets.map(b => {
                    const ratio = b.monthlyLimit > 0 ? (b.currentSpending / b.monthlyLimit) * 100 : 0;
                    const isExceeded = b.currentSpending > b.monthlyLimit;
                    const isClose = ratio >= 75 && !isExceeded;
                    
                    return (
                      <div key={b.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
                          <span style={{ color: 'white' }}>{b.category}</span>
                          <span style={{ color: isExceeded ? '#f87171' : isClose ? '#fbbf24' : '#10b981' }}>
                            ${b.currentSpending.toFixed(0)} / ${b.monthlyLimit.toFixed(0)}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, ratio)}%`,
                            height: '100%',
                            background: isExceeded ? '#ef4444' : isClose ? '#fbbf24' : '#10b981',
                            borderRadius: '3px',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: '#64748b' }}>
                          <span>{ratio.toFixed(0)}% utilized</span>
                          <button onClick={() => handleBudgetDelete(b.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0, cursor: 'pointer', fontSize: '0.7rem' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Savings Goals Panel */}
            <div className="glass-panel" style={{ padding: '28px', background: 'rgba(30, 27, 75, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Savings Goals</h3>
                <button onClick={() => setShowGoalModal(true)} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  + Set Goal
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {goals.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>No savings goals created.</div>
                ) : (
                  goals.map(g => {
                    const target = Number(g.targetAmount);
                    const current = Number(g.currentAmount);
                    const progress = target > 0 ? Math.round((current / target) * 100) : 0;
                    
                    return (
                      <div key={g.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
                          <span style={{ color: 'white' }}>{g.goalName}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: g.priority === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)', color: g.priority === 'HIGH' ? '#f87171' : '#818cf8' }}>
                            {g.priority} Priority
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 8px 0' }}>
                          Target: **${target.toFixed(0)}** | Saved: **${current.toFixed(0)}**
                        </p>
                        
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, progress)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                            borderRadius: '3px',
                          }} />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: '#64748b' }}>
                          <span>{progress}% achieved</span>
                          <button onClick={() => handleGoalDelete(g.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0, cursor: 'pointer', fontSize: '0.7rem' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Transaction Modal */}
        {showTxModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {isEditingTx ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <button onClick={() => setShowTxModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Title</label>
                  <input
                    id="finance-title"
                    type="text"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Type</label>
                    <select
                      id="finance-type"
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as any)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Amount ($)</label>
                    <input
                      id="finance-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={txAmount}
                      onChange={(e) => setTxAmount(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Category</label>
                    <input
                      id="finance-category"
                      type="text"
                      placeholder="Salary, Food, Housing..."
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Date</label>
                    <input
                      id="finance-date"
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Payment Method</label>
                  <input
                    id="finance-method"
                    type="text"
                    placeholder="Credit Card, Bank Transfer, PayPal"
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                  <input
                    id="finance-recurring"
                    type="checkbox"
                    checked={txRecurring}
                    onChange={(e) => setTxRecurring(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="finance-recurring" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>Recurring Transaction</label>
                </div>

                {txRecurring && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Recurrence Frequency</label>
                    <select
                      value={txRecurrence}
                      onChange={(e) => setTxRecurrence(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    id="finance-notes"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowTxModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {isEditingTx ? 'Save Changes' : 'Record Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget Modal */}
        {showBudgetModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Set Category Limit</h3>
                <button onClick={() => setShowBudgetModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Category Name</label>
                  <input
                    type="text"
                    placeholder="Food, Shopping, Entertainment..."
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Monthly Limit Target ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowBudgetModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Save Limit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal Modal */}
        {showGoalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Set Savings Goal</h3>
                <button onClick={() => setShowGoalModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Goal Name</label>
                  <input
                    type="text"
                    placeholder="Laptop, Higher Education, Emergency..."
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Target Amount ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Saved So Far ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={goalCurrent}
                      onChange={(e) => setGoalCurrent(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Target Date</label>
                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Monthly Save Target</label>
                    <input
                      type="number"
                      min="0"
                      value={goalContribution}
                      onChange={(e) => setGoalContribution(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Priority</label>
                    <select
                      value={goalPriority}
                      onChange={(e) => setGoalPriority(e.target.value as any)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Goal Category</label>
                    <input
                      type="text"
                      placeholder="Vehicle, Computer, reserves..."
                      value={goalCategoryField}
                      onChange={(e) => setGoalCategoryField(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowGoalModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Finance;
