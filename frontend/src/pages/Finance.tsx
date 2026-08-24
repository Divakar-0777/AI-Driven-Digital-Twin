import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
  X,
  Upload,
  Download
} from 'lucide-react';

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
  const [txDate, setTxDate] = useState(
    new Date().toISOString().split('T')[0]
  );
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
  const [goalPriority, setGoalPriority] =
    useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [goalCategoryField, setGoalCategoryField] =
    useState('Emergency Fund');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // LIGHT THEME COLORS - MATCHING OLD DASHBOARD DESIGN
  // ============================================================

  const colors = {
    page: '#f1f3f7',
    card: '#ffffff',
    cardSoft: '#f8fafc',
    text: '#1e293b',
    heading: '#172033',
    muted: '#64748b',
    lightMuted: '#94a3b8',
    border: '#e2e8f0',
    inputBorder: '#d7dee8',
    inputBg: '#ffffff',
    primary: '#5146c7',
    primaryLight: '#eef0ff',
    primaryBorder: '#d9dcff',
    success: '#1f9d7a',
    successBg: '#ecfdf5',
    danger: '#dc5b5b',
    dangerBg: '#fef2f2',
    warning: '#d99220',
    warningBg: '#fffbeb',
    shadow: '0 8px 25px rgba(15, 23, 42, 0.05)',
  };

  const cardStyle: React.CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '18px',
    boxShadow: colors.shadow,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    outline: 'none',
  };

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
  const categoriesList = Array.from(
    new Set(transactions.map((t) => t.category))
  );

  const filteredTransactions = transactions
    .filter((tx) => {
      const matchSearch =
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        filterType === 'ALL' || tx.type === filterType;

      const matchCategory =
        filterCategory === 'ALL' || tx.category === filterCategory;

      return matchSearch && matchType && matchCategory;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison =
          new Date(a.date).getTime() -
          new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      return sortOrder === 'desc'
        ? -comparison
        : comparison;
    });

  // ============================================================
  // TRANSACTION CRUD
  // ============================================================

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
      setError(
        err.response?.data?.error ||
          'Failed to save transaction'
      );
    }
  };

  const handleTxDelete = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this transaction?'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/transactions/${id}`);
      showFeedback('Transaction deleted');
      fetchFinanceData();
    } catch (err: any) {
      setError('Failed to delete transaction.');
    }
  };

  // ============================================================
  // BUDGET ACTIONS
  // ============================================================

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

  // ============================================================
  // GOAL ACTIONS
  // ============================================================

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

  // ============================================================
  // CSV IMPORT / EXPORT
  // ============================================================

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const csvText = evt.target?.result as string;

      try {
        const res = await api.post('/transactions/import', {
          csvText,
        });

        showFeedback(
          res.data.message || 'CSV imported successfully!'
        );

        fetchFinanceData();
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            'CSV import failed'
        );
      }
    };

    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    window.open(
      `${api.defaults.baseURL}/transactions/export?format=csv`,
      '_blank'
    );
  };

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: colors.page,
        color: colors.text,
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          marginLeft: '280px',
          padding: '40px 48px',
          boxSizing: 'border-box',
          minHeight: '100vh',
          background: colors.page,
        }}
      >
        {/* TOP HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: colors.heading,
                letterSpacing: '-0.5px',
                margin: 0,
              }}
            >
              AI Financial Digital Twin
            </h2>

            <p
              style={{
                color: colors.muted,
                marginTop: '8px',
                marginBottom: 0,
                fontSize: '1rem',
              }}
            >
              Log income, budgets, target savings goals, and audit
              categories with ML time-series predictions.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvImport}
              accept=".csv"
              style={{ display: 'none' }}
            />

            <button
              onClick={triggerImport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#475569',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              }}
            >
              <Upload size={16} />
              Import CSV
            </button>

            <button
              onClick={handleCsvExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#475569',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              }}
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              id="btn-add-transaction"
              onClick={openAddTxModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, #5146c7 0%, #7257d8 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 5px 15px rgba(81,70,199,0.22)',
              }}
            >
              <Plus size={18} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* SUCCESS */}
        {successMsg && (
          <div
            style={{
              background: colors.successBg,
              border: '1px solid #a7f3d0',
              color: '#15805f',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: '0.9rem',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: colors.dangerBg,
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* FINANCIAL SUMMARY */}
        {summary && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                ...cardStyle,
                padding: '28px 24px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Total Monthly Income
              </span>

              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: colors.success,
                  marginTop: '10px',
                }}
              >
                +${summary.totalIncome.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                ...cardStyle,
                padding: '28px 24px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Monthly Expenses
              </span>

              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: colors.danger,
                  marginTop: '10px',
                }}
              >
                -${summary.totalExpense.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                ...cardStyle,
                padding: '28px 24px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Net Monthly Savings
              </span>

              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: '#4f46c7',
                  marginTop: '10px',
                }}
              >
                ${summary.netSavings.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                ...cardStyle,
                padding: '28px 24px',
                border:
                  summary.expenseVsTargetStatus === 'OVER_BUDGET'
                    ? '1px solid #fecaca'
                    : `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Profile Expense Budget
              </span>

              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color:
                    summary.expenseVsTargetStatus === 'OVER_BUDGET'
                      ? colors.danger
                      : colors.success,
                  marginTop: '10px',
                }}
              >
                {summary.expenseVsTargetStatus === 'OVER_BUDGET'
                  ? 'OVER BUDGET'
                  : 'ON TARGET'}
              </div>

              <span
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: colors.muted,
                  marginTop: '6px',
                }}
              >
                Target limit: $
                {summary.monthlyExpenseTarget.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '32px',
          }}
        >
          {/* LEFT COLUMN */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            {/* FILTER PANEL */}
            <div
              style={{
                ...cardStyle,
                padding: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: '180px',
                }}
              >
                <input
                  type="text"
                  placeholder="Search title, category..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value)
                  }
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: '#ffffff',
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expense Only</option>
                </select>
              </div>

              <div>
                <select
                  value={filterCategory}
                  onChange={(e) =>
                    setFilterCategory(e.target.value)
                  }
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: '#ffffff',
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Categories</option>

                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: '#ffffff',
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>

              <button
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === 'asc' ? 'desc' : 'asc'
                  )
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.inputBorder}`,
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {sortOrder === 'desc'
                  ? '▼ Desc'
                  : '▲ Asc'}
              </button>
            </div>

            {/* TRANSACTION TABLE */}
            <div
              style={{
                ...cardStyle,
                padding: '28px',
                overflowX: 'auto',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: '20px',
                  color: colors.heading,
                }}
              >
                Transaction History
              </h3>

              {loading ? (
                <div style={{ color: colors.muted }}>
                  Syncing ledger...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: colors.muted,
                    padding: '40px 0',
                  }}
                >
                  No transactions recorded matching filters.
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        color: colors.muted,
                      }}
                    >
                      <th style={{ padding: '12px 16px' }}>
                        Title
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Type
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Category
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Amount
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Method
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Date
                      </th>
                      <th style={{ padding: '12px 16px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        style={{
                          borderBottom: `1px solid #eef1f5`,
                          color: colors.text,
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontWeight: 600,
                            color: colors.text,
                          }}
                        >
                          {tx.title}

                          {tx.recurring && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                background: colors.primaryLight,
                                color: colors.primary,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px',
                              }}
                            >
                              🔄 {tx.recurrenceFrequency}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background:
                                tx.type === 'INCOME'
                                  ? '#ecfdf5'
                                  : '#fef2f2',
                              color:
                                tx.type === 'INCOME'
                                  ? '#168565'
                                  : '#dc5b5b',
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            color: colors.muted,
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Tag size={13} />
                            {tx.category}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            fontWeight: 700,
                            color:
                              tx.type === 'INCOME'
                                ? colors.success
                                : colors.text,
                          }}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'}$
                          {Number(tx.amount).toFixed(2)}
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            color: colors.muted,
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <CreditCard size={13} />
                            {tx.paymentMethod}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            color: colors.muted,
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Calendar size={13} />
                            {new Date(
                              tx.date
                            ).toLocaleDateString()}
                          </span>
                        </td>

                        <td style={{ padding: '16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '12px',
                            }}
                          >
                            <button
                              onClick={() =>
                                openEditTxModal(tx)
                              }
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: colors.primary,
                                padding: 0,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={() =>
                                handleTxDelete(tx.id)
                              }
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: colors.danger,
                                padding: 0,
                                cursor: 'pointer',
                              }}
                            >
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

          {/* RIGHT COLUMN */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            {/* BUDGETS */}
            <div
              style={{
                ...cardStyle,
                padding: '28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: colors.heading,
                    margin: 0,
                  }}
                >
                  Category Budgets
                </h3>

                <button
                  onClick={() =>
                    setShowBudgetModal(true)
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  + Set Limit
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {budgets.length === 0 ? (
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    No category budgets set.
                  </div>
                ) : (
                  budgets.map((b) => {
                    const ratio =
                      b.monthlyLimit > 0
                        ? (b.currentSpending /
                            b.monthlyLimit) *
                          100
                        : 0;

                    const isExceeded =
                      b.currentSpending > b.monthlyLimit;

                    const isClose =
                      ratio >= 75 && !isExceeded;

                    return (
                      <div
                        key={b.id}
                        style={{
                          padding: '14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            marginBottom: '6px',
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              color: colors.text,
                            }}
                          >
                            {b.category}
                          </span>

                          <span
                            style={{
                              color: isExceeded
                                ? colors.danger
                                : isClose
                                ? colors.warning
                                : colors.success,
                            }}
                          >
                            ${b.currentSpending.toFixed(0)} / $
                            {b.monthlyLimit.toFixed(0)}
                          </span>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: '#e9edf3',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                ratio
                              )}%`,
                              height: '100%',
                              background: isExceeded
                                ? '#ef4444'
                                : isClose
                                ? '#f59e0b'
                                : '#27a784',
                              borderRadius: '3px',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            marginTop: '6px',
                            fontSize: '0.7rem',
                            color: colors.muted,
                          }}
                        >
                          <span>
                            {ratio.toFixed(0)}% utilized
                          </span>

                          <button
                            onClick={() =>
                              handleBudgetDelete(b.id)
                            }
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: colors.danger,
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SAVINGS GOALS */}
            <div
              style={{
                ...cardStyle,
                padding: '28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: colors.heading,
                    margin: 0,
                  }}
                >
                  Savings Goals
                </h3>

                <button
                  onClick={() => setShowGoalModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  + Set Goal
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {goals.length === 0 ? (
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    No savings goals created.
                  </div>
                ) : (
                  goals.map((g) => {
                    const target = Number(g.targetAmount);
                    const current = Number(g.currentAmount);

                    const progress =
                      target > 0
                        ? Math.round(
                            (current / target) * 100
                          )
                        : 0;

                    return (
                      <div
                        key={g.id}
                        style={{
                          padding: '14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              color: colors.text,
                            }}
                          >
                            {g.goalName}
                          </span>

                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              background:
                                g.priority === 'HIGH'
                                  ? '#fef2f2'
                                  : colors.primaryLight,
                              color:
                                g.priority === 'HIGH'
                                  ? colors.danger
                                  : colors.primary,
                            }}
                          >
                            {g.priority} Priority
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: colors.muted,
                            margin: '4px 0 8px 0',
                          }}
                        >
                          Target: ${target.toFixed(0)} | Saved: $
                          {current.toFixed(0)}
                        </p>

                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: '#e9edf3',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                progress
                              )}%`,
                              height: '100%',
                              background:
                                'linear-gradient(90deg, #5146c7 0%, #8064df 100%)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            marginTop: '6px',
                            fontSize: '0.7rem',
                            color: colors.muted,
                          }}
                        >
                          <span>{progress}% achieved</span>

                          <button
                            onClick={() =>
                              handleGoalDelete(g.id)
                            }
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: colors.danger,
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
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

        {/* TRANSACTION MODAL */}
        {showTxModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '32px',
                boxSizing: 'border-box',
                background: '#ffffff',
                borderRadius: '18px',
                border: `1px solid ${colors.border}`,
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: colors.heading,
                    margin: 0,
                  }}
                >
                  {isEditingTx
                    ? 'Edit Transaction'
                    : 'Record Transaction'}
                </h3>

                <button
                  onClick={() => setShowTxModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.muted,
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleTxSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Title
                  </label>

                  <input
                    id="finance-title"
                    type="text"
                    value={txTitle}
                    onChange={(e) =>
                      setTxTitle(e.target.value)
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Type
                    </label>

                    <select
                      id="finance-type"
                      value={txType}
                      onChange={(e) =>
                        setTxType(e.target.value as any)
                      }
                      style={inputStyle}
                    >
                      <option value="EXPENSE">
                        Expense
                      </option>
                      <option value="INCOME">
                        Income
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Amount ($)
                    </label>

                    <input
                      id="finance-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={txAmount}
                      onChange={(e) =>
                        setTxAmount(Number(e.target.value))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Category
                    </label>

                    <input
                      id="finance-category"
                      type="text"
                      placeholder="Salary, Food, Housing..."
                      value={txCategory}
                      onChange={(e) =>
                        setTxCategory(e.target.value)
                      }
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Date
                    </label>

                    <input
                      id="finance-date"
                      type="date"
                      value={txDate}
                      onChange={(e) =>
                        setTxDate(e.target.value)
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Payment Method
                  </label>

                  <input
                    id="finance-method"
                    type="text"
                    placeholder="Credit Card, Bank Transfer, PayPal"
                    value={txPaymentMethod}
                    onChange={(e) =>
                      setTxPaymentMethod(e.target.value)
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: '8px 0',
                  }}
                >
                  <input
                    id="finance-recurring"
                    type="checkbox"
                    checked={txRecurring}
                    onChange={(e) =>
                      setTxRecurring(e.target.checked)
                    }
                    style={{ cursor: 'pointer' }}
                  />

                  <label
                    htmlFor="finance-recurring"
                    style={{
                      fontSize: '0.85rem',
                      color: colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    Recurring Transaction
                  </label>
                </div>

                {txRecurring && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Recurrence Frequency
                    </label>

                    <select
                      value={txRecurrence}
                      onChange={(e) =>
                        setTxRecurrence(e.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">
                        Monthly
                      </option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Notes
                  </label>

                  <textarea
                    id="finance-notes"
                    value={txNotes}
                    onChange={(e) =>
                      setTxNotes(e.target.value)
                    }
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowTxModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#475569',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      background:
                        'linear-gradient(135deg, #5146c7 0%, #7257d8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {isEditingTx
                      ? 'Save Changes'
                      : 'Record Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BUDGET MODAL */}
        {showBudgetModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                boxSizing: 'border-box',
                background: '#ffffff',
                borderRadius: '18px',
                border: `1px solid ${colors.border}`,
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: colors.heading,
                    margin: 0,
                  }}
                >
                  Set Category Limit
                </h3>

                <button
                  onClick={() =>
                    setShowBudgetModal(false)
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.muted,
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleBudgetSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Category Name
                  </label>

                  <input
                    type="text"
                    placeholder="Food, Shopping, Entertainment..."
                    value={budgetCategory}
                    onChange={(e) =>
                      setBudgetCategory(e.target.value)
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Monthly Limit Target ($)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={budgetLimit}
                    onChange={(e) =>
                      setBudgetLimit(Number(e.target.value))
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowBudgetModal(false)
                    }
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#475569',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background:
                        'linear-gradient(135deg, #5146c7 0%, #7257d8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Save Limit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GOAL MODAL */}
        {showGoalModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '32px',
                boxSizing: 'border-box',
                background: '#ffffff',
                borderRadius: '18px',
                border: `1px solid ${colors.border}`,
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: colors.heading,
                    margin: 0,
                  }}
                >
                  Set Savings Goal
                </h3>

                <button
                  onClick={() =>
                    setShowGoalModal(false)
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.muted,
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleGoalSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: colors.muted,
                      marginBottom: '6px',
                    }}
                  >
                    Goal Name
                  </label>

                  <input
                    type="text"
                    placeholder="Laptop, Higher Education, Emergency..."
                    value={goalName}
                    onChange={(e) =>
                      setGoalName(e.target.value)
                    }
                    required
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Target Amount ($)
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={goalTarget}
                      onChange={(e) =>
                        setGoalTarget(Number(e.target.value))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Saved So Far ($)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={goalCurrent}
                      onChange={(e) =>
                        setGoalCurrent(Number(e.target.value))
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Target Date
                    </label>

                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) =>
                        setGoalDate(e.target.value)
                      }
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Monthly Save Target
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={goalContribution}
                      onChange={(e) =>
                        setGoalContribution(
                          Number(e.target.value)
                        )
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Priority
                    </label>

                    <select
                      value={goalPriority}
                      onChange={(e) =>
                        setGoalPriority(
                          e.target.value as any
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="HIGH">
                        High Priority
                      </option>
                      <option value="MEDIUM">
                        Medium Priority
                      </option>
                      <option value="LOW">
                        Low Priority
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: colors.muted,
                        marginBottom: '6px',
                      }}
                    >
                      Goal Category
                    </label>

                    <input
                      type="text"
                      placeholder="Vehicle, Computer, reserves..."
                      value={goalCategoryField}
                      onChange={(e) =>
                        setGoalCategoryField(
                          e.target.value
                        )
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowGoalModal(false)
                    }
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#475569',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background:
                        'linear-gradient(135deg, #5146c7 0%, #7257d8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
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