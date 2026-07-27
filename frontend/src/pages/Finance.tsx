import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Plus, Edit2, Trash2, Calendar, Tag, CreditCard, X } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  monthlyExpenseTarget: number;
  expenseVsTargetStatus: string;
}

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [txRes, summaryRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary'),
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setTitle('');
    setCategory('');
    setType('EXPENSE');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (tx: Transaction) => {
    setIsEditing(true);
    setCurrentId(tx.id);
    setTitle(tx.title);
    setCategory(tx.category);
    setType(tx.type);
    setAmount(Number(tx.amount));
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    setPaymentMethod(tx.paymentMethod);
    setNotes(tx.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    const payload = {
      title,
      category,
      type,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      paymentMethod,
      notes: notes || null,
    };

    try {
      if (isEditing && currentId) {
        await api.put(`/transactions/${currentId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      setShowModal(false);
      fetchFinanceData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to delete transaction.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-highlight)' }}>Financial Tracker</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Log income, target budgets, track expense categories, and audit monthly balances.
            </p>
          </div>
          <button id="btn-add-transaction" onClick={openAddModal} className="btn-primary">
            <Plus size={18} /> Add Transaction
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Financial Summaries */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Income</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                +${summary.totalIncome.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Expenses</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
                -${summary.totalExpense.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Savings</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-highlight)', marginTop: '4px' }}>
                ${summary.netSavings.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '20px', border: summary.expenseVsTargetStatus === 'OVER_BUDGET' ? '1px solid var(--danger)' : '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expense vs Budget Target</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: summary.expenseVsTargetStatus === 'OVER_BUDGET' ? 'var(--danger)' : 'var(--success)', marginTop: '6px' }}>
                {summary.expenseVsTargetStatus === 'OVER_BUDGET' ? 'OVER BUDGET' : 'WITHIN BUDGET'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: ${summary.monthlyExpenseTarget.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '20px' }}>
            Transaction History
          </h3>

          {loading ? (
            <div>Loading Transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No transactions recorded yet. Click Add Transaction to start.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Title</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Type</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Amount</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Payment Method</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'white' }}>{tx.title}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={14} /> {tx.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: tx.type === 'INCOME' ? 'var(--success)' : 'white' }}>
                      {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {new Date(tx.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={14} /> {tx.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => openEditModal(tx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: 0, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Title</label>
                  <input
                    id="finance-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Type</label>
                    <select
                      id="finance-type"
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Amount ($)</label>
                    <input
                      id="finance-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                    <input
                      id="finance-category"
                      type="text"
                      placeholder="Salary, Food, Housing..."
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                    <input
                      id="finance-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Payment Method</label>
                  <input
                    id="finance-method"
                    type="text"
                    placeholder="Credit Card, Bank Transfer, PayPal"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    id="finance-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                    {isEditing ? 'Save Changes' : 'Record Transaction'}
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
