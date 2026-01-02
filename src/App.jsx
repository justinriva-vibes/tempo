import React, { useState, useEffect } from 'react';

// Color palette
const colors = {
  bgPrimary: '#121212',
  bgSurface: '#1E1E1E',
  bgHover: '#282828',
  border: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDim: '#666666',
  accentGreen: '#1DB954',
  accentBlue: '#2E77D0',
  urgent: '#E35454',
  warning: '#F59E0B',
  red: '#E35454',
};

// Tier configuration
const tierConfig = {
  do_today: { label: 'DO TODAY', subtitle: 'Quick Wins', color: colors.accentGreen, dotStyle: 'solid' },
  should_do: { label: 'SHOULD DO', subtitle: 'Big Bets & Promoted', color: colors.accentBlue, dotStyle: 'solid' },
  could_do: { label: 'IF YOU HAVE TIME', subtitle: 'Fill-ins', color: colors.textSecondary, dotStyle: 'ring' },
  defer: { label: 'RECONSIDER', subtitle: 'Time Sinks', color: colors.textSecondary, dotStyle: 'none' },
};

// Scoring constants
const QUADRANT_SCORES = {
  quick_win: 100,
  big_bet: 70,
  fill_in: 40,
  time_sink: 20,
};

const DEADLINE_MODIFIERS = {
  today: 30,
  this_week: 15,
  this_sprint: 0,
  after_sprint: -10,
};

const TIER_THRESHOLDS = {
  do_today: 90,
  should_do: 60,
  could_do: 30,
};

// Prioritization logic
function getQuadrant(impact, effort) {
  if (impact === 'high' && effort === 'low') return 'quick_win';
  if (impact === 'high' && effort === 'high') return 'big_bet';
  if (impact === 'low' && effort === 'low') return 'fill_in';
  return 'time_sink';
}

function calculateScore(quadrant, deadline) {
  return QUADRANT_SCORES[quadrant] + DEADLINE_MODIFIERS[deadline];
}

function getTier(score) {
  if (score >= TIER_THRESHOLDS.do_today) return 'do_today';
  if (score >= TIER_THRESHOLDS.should_do) return 'should_do';
  if (score >= TIER_THRESHOLDS.could_do) return 'could_do';
  return 'defer';
}

// Helper functions for daily review task tracking
function getReviewedTasksForDate(date) {
  const key = `tempo_reviewed_tasks_${date.toDateString()}`;
  const stored = localStorage.getItem(key);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function addToReviewedTasks(taskId, date) {
  const key = `tempo_reviewed_tasks_${date.toDateString()}`;
  const reviewed = getReviewedTasksForDate(date);
  reviewed.add(taskId);
  localStorage.setItem(key, JSON.stringify(Array.from(reviewed)));
}

function cleanupOldReviewData() {
  const keys = Object.keys(localStorage);
  const reviewDataKeys = keys.filter(k => k.startsWith('tempo_reviewed_tasks_'));
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  reviewDataKeys.forEach(key => {
    const dateStr = key.replace('tempo_reviewed_tasks_', '');
    const keyDate = new Date(dateStr);
    if (keyDate < thirtyDaysAgo) {
      localStorage.removeItem(key);
    }
  });
}

function generateReason(task, quadrant) {
  const quadrantLabels = {
    quick_win: 'Quick win',
    big_bet: 'Big bet',
    fill_in: 'Fill-in',
    time_sink: 'Time sink',
  };
  const impactText = task.impact === 'high' ? 'high impact' : 'low impact';
  const effortText = task.effort === 'low' ? 'low effort' : 'high effort';
  const deadlineText = {
    today: 'due today',
    this_week: 'due this week',
    this_sprint: 'due this sprint',
    after_sprint: 'no rush',
  };
  return `${quadrantLabels[quadrant]} · ${impactText} · ${effortText}`;
}

function rankTasks(tasks) {
  const ranked = tasks.map(task => {
    const quadrant = getQuadrant(task.impact, task.effort);
    const score = calculateScore(quadrant, task.deadline);
    const tier = getTier(score);
    const reason = generateReason(task, quadrant);
    return { ...task, quadrant, tier, score, reason };
  });

  ranked.sort((a, b) => {
    // Primary: Sort by score
    if (b.score !== a.score) return b.score - a.score;

    // Secondary: Sort by deadline urgency
    const deadlineOrder = { today: 0, this_week: 1, this_sprint: 2, after_sprint: 3 };
    const deadlineDiff = deadlineOrder[a.deadline] - deadlineOrder[b.deadline];
    if (deadlineDiff !== 0) return deadlineDiff;

    // Tertiary: Sort by creation time
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return ranked;
}

// ==================== SCREENS ====================

// Welcome Screen
const WelcomeScreen = ({ onContinue }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  }}>
    <div style={{
      width: '80px',
      height: '80px',
      backgroundColor: colors.accentGreen,
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.bgPrimary} strokeWidth="2.5">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </div>

    <h1 style={{
      color: colors.textPrimary,
      fontSize: '42px',
      fontWeight: 700,
      margin: 0,
      marginBottom: '16px',
      letterSpacing: '-1px',
    }}>
      Tempo
    </h1>

    <p style={{
      color: colors.textSecondary,
      fontSize: '18px',
      maxWidth: '320px',
      lineHeight: 1.5,
      marginBottom: '48px',
    }}>
      Focus on what moves the needle.
      <br />
      Skip what doesn't.
    </p>

    <button
      onClick={onContinue}
      style={{
        padding: '16px 48px',
        backgroundColor: colors.accentGreen,
        color: colors.bgPrimary,
        border: 'none',
        borderRadius: '32px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      }}
      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
    >
      GET STARTED
    </button>
  </div>
);

// Empty State
const EmptyState = ({ onAddTask }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  }}>
    <div style={{
      width: '120px',
      height: '120px',
      backgroundColor: colors.bgSurface,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
    }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={colors.textDim} strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    </div>

    <h2 style={{
      color: colors.textPrimary,
      fontSize: '24px',
      fontWeight: 700,
      margin: 0,
      marginBottom: '12px',
    }}>
      What's on your plate?
    </h2>

    <p style={{
      color: colors.textSecondary,
      fontSize: '16px',
      maxWidth: '280px',
      lineHeight: 1.5,
      marginBottom: '32px',
    }}>
      Add your tasks. We'll sort them by impact, effort, and deadline.
    </p>

    <button
      onClick={onAddTask}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '16px 32px',
        backgroundColor: colors.accentGreen,
        color: colors.bgPrimary,
        border: 'none',
        borderRadius: '32px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '22px', lineHeight: 1 }}>+</span>
      ADD YOUR FIRST TASK
    </button>

    <p style={{
      color: colors.textDim,
      fontSize: '14px',
      marginTop: '24px',
    }}>
      Tip: Start with 3-5 tasks
    </p>
  </div>
);

// Task Summary Component
const TaskSummary = ({ name, impact, effort, step }) => {
  if (step === 0) return null;

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto 32px auto',
      width: '100%',
      padding: '16px 20px',
      backgroundColor: colors.bgSurface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
    }}>
      <div style={{
        color: colors.textPrimary,
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: step > 1 ? '12px' : '0'
      }}>
        {name}
      </div>
      {step > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {impact && (
            <span style={{
              backgroundColor: colors.bgHover,
              color: colors.textSecondary,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Impact: {impact === 'high' ? 'High' : 'Low'}
            </span>
          )}
          {step > 2 && effort && (
            <span style={{
              backgroundColor: colors.bgHover,
              color: colors.textSecondary,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Effort: {effort === 'low' ? 'Low' : 'High'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Add Task Screen
const AddTaskScreen = ({ onSave, onDone, taskCount }) => {
  const [name, setName] = useState('');
  const [impact, setImpact] = useState(null);
  const [effort, setEffort] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [step, setStep] = useState(0);

  const impactOptions = [
    { value: 'high', label: 'High impact' },
    { value: 'low', label: 'Low impact' },
  ];

  const [showHighImpactHelp, setShowHighImpactHelp] = useState(false);
  const [showLowImpactHelp, setShowLowImpactHelp] = useState(false);

  const highImpactHints = [
    '...directly contribute to a key goal.',
    '...would cause real consequences if skipped (e.g., revenue, security, and compliance).',
    '...affect many customers, users, or teammates.',
    '...are blocking others or unlock new capability.',
    '...are visible to key stakeholders or customers.',
  ];

  const lowImpactHints = [
    '...are tangential or unrelated to key goals.',
    '...carry little risk if deprioritized.',
    '...only affect a few people or just yourself.',
    '...are isolated—nothing depends on them.',
    '...won\'t be seen or valued by key stakeholders or customers.',
  ];

  const effortOptions = [
    { value: 'low', label: 'Low effort', desc: 'Quick, easy, minimal friction' },
    { value: 'high', label: 'High effort', desc: 'Significant time or energy' },
  ];

  const deadlineOptions = [
    { value: 'today', label: 'Today', desc: 'Must be done today' },
    { value: 'this_week', label: 'This week', desc: 'Due within the next few days' },
    { value: 'this_sprint', label: 'This sprint', desc: 'Due before the sprint ends' },
    { value: 'after_sprint', label: 'After this sprint / No deadline', desc: 'Can wait or has no hard deadline' },
  ];

  const handleSave = () => {
    onSave({ name, impact, effort, deadline });
    setName('');
    setImpact(null);
    setEffort(null);
    setDeadline(null);
    setStep(0);
    setShowHighImpactHelp(false);
    setShowLowImpactHelp(false);
  };

  const handleDone = () => {
    setShowHighImpactHelp(false);
    setShowLowImpactHelp(false);
    setStep(0);
    setName('');
    setImpact(null);
    setEffort(null);
    setDeadline(null);
    onDone();
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return impact !== null;
    if (step === 2) return effort !== null;
    if (step === 3) return deadline !== null;
    return false;
  };

  const handleNext = () => {
    setShowHighImpactHelp(false);
    setShowLowImpactHelp(false);
    if (step < 3) setStep(step + 1);
    else handleSave();
  };

  const OptionCard = ({ selected, onClick, label, desc }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px',
        backgroundColor: selected ? colors.bgHover : colors.bgSurface,
        border: `2px solid ${selected ? colors.accentGreen : colors.border}`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        marginBottom: '12px',
      }}
    >
      <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '16px' }}>
        {label}
      </div>
      {desc && (
        <div style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>{desc}</div>
      )}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          {taskCount > 0 ? `${taskCount} task${taskCount > 1 ? 's' : ''} added` : 'Adding task'}
        </div>
        {taskCount >= 1 && (
          <button
            onClick={handleDone}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: colors.accentGreen,
              border: `1px solid ${colors.accentGreen}`,
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            DONE ADDING
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '48px',
      }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              backgroundColor: i <= step ? colors.accentGreen : colors.border,
              borderRadius: '2px',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <TaskSummary name={name} impact={impact} effort={effort} step={step} />

      <div style={{ flex: 1, maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {step === 0 && (
          <>
            <h2 style={{ color: colors.textPrimary, fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>
              What do you need to do?
            </h2>
            <input
              type="text"
              placeholder="e.g., Finish project proposal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
              autoFocus
              style={{
                width: '100%',
                padding: '20px',
                backgroundColor: colors.bgSurface,
                border: `2px solid ${name ? colors.accentGreen : colors.border}`,
                borderRadius: '12px',
                color: colors.textPrimary,
                fontSize: '18px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <button
              onClick={() => {
                setShowHighImpactHelp(false);
                setShowLowImpactHelp(false);
                setStep(0);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 style={{ color: colors.textPrimary, fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>
              What's the impact?
            </h2>

            {/* High Impact Option */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: impact === 'high' ? colors.bgHover : colors.bgSurface,
                  border: `2px solid ${impact === 'high' ? colors.accentGreen : colors.border}`,
                  borderRadius: showHighImpactHelp ? '12px 12px 0 0' : '12px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setImpact('high')}
                  style={{
                    flex: 1,
                    padding: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '16px' }}>
                    High impact
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHighImpactHelp(!showHighImpactHelp);
                    setShowLowImpactHelp(false);
                  }}
                  style={{
                    padding: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderLeft: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.textSecondary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textSecondary,
                    fontSize: '14px',
                    fontWeight: 700,
                  }}>
                    ?
                  </div>
                </button>
              </div>
              {showHighImpactHelp && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: colors.bgSurface,
                  border: `2px solid ${impact === 'high' ? colors.accentGreen : colors.border}`,
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                }}>
                  <div style={{ color: colors.textDim, fontSize: '13px', marginBottom: '12px' }}>
                    Things that are HIGH impact...
                  </div>
                  {highImpactHints.map((hint, i) => (
                    <div key={i} style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: i < highImpactHints.length - 1 ? '8px' : '0' }}>
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Low Impact Option */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: impact === 'low' ? colors.bgHover : colors.bgSurface,
                  border: `2px solid ${impact === 'low' ? colors.accentGreen : colors.border}`,
                  borderRadius: showLowImpactHelp ? '12px 12px 0 0' : '12px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setImpact('low')}
                  style={{
                    flex: 1,
                    padding: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '16px' }}>
                    Low impact
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLowImpactHelp(!showLowImpactHelp);
                    setShowHighImpactHelp(false);
                  }}
                  style={{
                    padding: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderLeft: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.textSecondary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textSecondary,
                    fontSize: '14px',
                    fontWeight: 700,
                  }}>
                    ?
                  </div>
                </button>
              </div>
              {showLowImpactHelp && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: colors.bgSurface,
                  border: `2px solid ${impact === 'low' ? colors.accentGreen : colors.border}`,
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                }}>
                  <div style={{ color: colors.textDim, fontSize: '13px', marginBottom: '12px' }}>
                    Things that are LOW impact...
                  </div>
                  {lowImpactHints.map((hint, i) => (
                    <div key={i} style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: i < lowImpactHints.length - 1 ? '8px' : '0' }}>
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <button
              onClick={() => {
                setShowHighImpactHelp(false);
                setShowLowImpactHelp(false);
                setStep(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 style={{ color: colors.textPrimary, fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>
              What's the effort?
            </h2>
            {effortOptions.map(opt => (
              <OptionCard
                key={opt.value}
                selected={effort === opt.value}
                onClick={() => setEffort(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <button
              onClick={() => {
                setShowHighImpactHelp(false);
                setShowLowImpactHelp(false);
                setStep(2);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 style={{ color: colors.textPrimary, fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>
              When does this need to be done?
            </h2>
            {deadlineOptions.map(opt => (
              <OptionCard
                key={opt.value}
                selected={deadline === opt.value}
                onClick={() => setDeadline(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </>
        )}
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%', paddingTop: '24px' }}>
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          style={{
            width: '100%',
            padding: '18px',
            backgroundColor: canProceed() ? colors.accentGreen : colors.bgSurface,
            color: canProceed() ? colors.bgPrimary : colors.textDim,
            border: 'none',
            borderRadius: '32px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: canProceed() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          {step === 3 ? 'SAVE TASK' : 'NEXT'}
        </button>
      </div>
    </div>
  );
};

// Deadline Badge Component
const DeadlineBadge = ({ deadline }) => {
  const config = {
    today: { label: 'TODAY', color: colors.urgent, bg: colors.urgent + '20' },
    this_week: { label: 'THIS WEEK', color: colors.warning, bg: colors.warning + '20' },
    this_sprint: { label: 'THIS SPRINT', color: colors.textSecondary, bg: colors.bgPrimary },
    after_sprint: null,
  };

  const badge = config[deadline];
  if (!badge) return null;

  return (
    <div style={{
      padding: '4px 10px',
      backgroundColor: badge.bg,
      borderRadius: '12px',
      fontSize: '11px',
      color: badge.color,
      fontWeight: 700,
      letterSpacing: '0.5px',
      flexShrink: 0,
    }}>
      {badge.label}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onComplete, onUpdate, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editImpact, setEditImpact] = useState(task.impact);
  const [editEffort, setEditEffort] = useState(task.effort);
  const [editDeadline, setEditDeadline] = useState(task.deadline);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const tier = tierConfig[task.tier];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => onComplete?.(task.id), 300);
  };

  const handleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditName(task.name);
      setEditImpact(task.impact);
      setEditEffort(task.effort);
      setEditDeadline(task.deadline);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editName.trim().length === 0) return; // Prevent empty names
    onUpdate?.(task.id, {
      name: editName,
      impact: editImpact,
      effort: editEffort,
      deadline: editDeadline,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const deadlineOptions = [
    { value: 'today', label: 'Today', desc: 'Must be done today' },
    { value: 'this_week', label: 'This week', desc: 'Due within the next few days' },
    { value: 'this_sprint', label: 'This sprint', desc: 'Due before the sprint ends' },
    { value: 'after_sprint', label: 'After this sprint / No deadline', desc: 'Can wait or has no hard deadline' },
  ];

  return (
    <div
      className="task-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: isHovered ? colors.bgHover : colors.bgSurface,
        borderRadius: '8px',
        borderLeft: `4px solid ${tier.color}`,
        transition: 'all 0.2s ease',
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      {isMobile ? (
        /* MOBILE LAYOUT */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto',
          gridTemplateRows: 'auto auto auto',
          columnGap: '8px',
          rowGap: '8px',
        }}>
          {/* Row 1: Rank, Checkbox, Task Name, Score */}
          <div style={{
            gridColumn: '1',
            gridRow: '1',
            width: '24px',
            textAlign: 'center',
            color: colors.textDim,
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {task.rank}
          </div>

          <div
            onClick={handleComplete}
            style={{
              gridColumn: '2',
              gridRow: '1',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: `2px solid ${isCompleted ? colors.accentGreen : colors.textSecondary}`,
              backgroundColor: isCompleted ? colors.accentGreen : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
          >
            {isCompleted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.bgPrimary} strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          <div style={{ gridColumn: '3', gridRow: '1', minWidth: 0 }}>
            <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none' }}>
              {task.name}
            </div>
          </div>

          <div style={{
            gridColumn: '4',
            gridRow: '1',
            padding: '6px 12px',
            backgroundColor: colors.bgPrimary,
            borderRadius: '16px',
            fontSize: '13px',
            color: colors.textDim,
            fontWeight: 600,
            alignSelf: 'start',
          }}>
            {task.score}
          </div>

          {/* Row 2: Deadline badge and action buttons spanning full width */}
          <div style={{
            gridColumn: '1 / 5',
            gridRow: '2',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <DeadlineBadge deadline={task.deadline} />
            <button
              onClick={handleEdit}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {!isDeletingConfirm ? (
              <button
                onClick={() => setIsDeletingConfirm(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  minHeight: '40px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsDeletingConfirm(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete?.(task.id);
                    setIsDeletingConfirm(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.urgent,
                    color: colors.textPrimary,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Row 3: Task reason spanning full width */}
          <div style={{
            gridColumn: '1 / 5',
            gridRow: '3',
            color: colors.textSecondary,
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {task.reason}
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT */
        <div className="task-card-content">
          {/* Rank number */}
          <div className="task-rank" style={{
            width: '24px',
            textAlign: 'center',
            color: colors.textDim,
            fontSize: '14px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {task.rank}
          </div>

          <div
            className="task-checkbox"
            onClick={handleComplete}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: `2px solid ${isCompleted ? colors.accentGreen : colors.textSecondary}`,
              backgroundColor: isCompleted ? colors.accentGreen : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
          >
            {isCompleted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.bgPrimary} strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          <div className="task-main">
          <div className="task-header-row" style={{
            marginBottom: '4px',
          }}>
            <span style={{
              color: colors.textPrimary,
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: isCompleted ? 'line-through' : 'none',
            }}>
              {task.name}
            </span>
            <DeadlineBadge deadline={task.deadline} />
            {/* Edit icon - always visible */}
            <button
              className="task-action-button"
              onClick={handleEdit}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {/* Delete icon or confirmation UI */}
            {!isDeletingConfirm ? (
              <button
                className="task-action-button"
                onClick={() => setIsDeletingConfirm(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsDeletingConfirm(false)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: '8px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete?.(task.id);
                    setIsDeletingConfirm(false);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.urgent,
                    color: colors.textPrimary,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: '8px',
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
          <div className="task-reason" style={{ color: colors.textSecondary, fontSize: '14px' }}>
            {task.reason}
          </div>
        </div>

        <div className="task-score" style={{
          padding: '6px 12px',
          backgroundColor: colors.bgPrimary,
          borderRadius: '16px',
          fontSize: '13px',
          color: colors.textDim,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {task.score}
        </div>
        </div>
      )}

      {/* Inline edit form */}
      {isEditing && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Task name input */}
          <div>
            <div style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Task name
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.bgPrimary,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Impact selector */}
          <div>
            <div style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Impact
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditImpact('high')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: editImpact === 'high' ? colors.bgHover : colors.bgPrimary,
                  border: `2px solid ${editImpact === 'high' ? colors.accentGreen : colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                High impact
              </button>
              <button
                onClick={() => setEditImpact('low')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: editImpact === 'low' ? colors.bgHover : colors.bgPrimary,
                  border: `2px solid ${editImpact === 'low' ? colors.accentGreen : colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Low impact
              </button>
            </div>
          </div>

          {/* Effort selector */}
          <div>
            <div style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Effort
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditEffort('low')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: editEffort === 'low' ? colors.bgHover : colors.bgPrimary,
                  border: `2px solid ${editEffort === 'low' ? colors.accentGreen : colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Low effort
              </button>
              <button
                onClick={() => setEditEffort('high')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: editEffort === 'high' ? colors.bgHover : colors.bgPrimary,
                  border: `2px solid ${editEffort === 'high' ? colors.accentGreen : colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                High effort
              </button>
            </div>
          </div>

          {/* Deadline selector */}
          <div>
            <div style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Deadline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deadlineOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEditDeadline(opt.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: editDeadline === opt.value ? colors.bgHover : colors.bgPrimary,
                    border: `2px solid ${editDeadline === opt.value ? colors.accentGreen : colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '14px' }}>
                    {opt.label}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '13px', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: colors.accentGreen,
                color: colors.bgPrimary,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save changes
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Tier Section Component
const TierSection = ({ tier, tasks, onComplete, onUpdate, onDelete }) => {
  const config = tierConfig[tier];
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        {config.dotStyle === 'solid' && (
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: config.color,
          }} />
        )}
        {config.dotStyle === 'ring' && (
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: `2px solid ${config.color}`,
          }} />
        )}
        <span style={{
          color: config.color,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '1.5px',
        }}>
          {config.label}
        </span>
        <span style={{ color: colors.textDim, fontSize: '12px' }}>
          {config.subtitle}
        </span>
        <span style={{ color: colors.textSecondary, fontSize: '12px' }}>
          · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={onComplete} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

// Matrix Visualization Component
const MatrixView = ({ tasks, setShowMatrix }) => {
  const quadrantTasks = {
    quick_win: tasks.filter(t => t.quadrant === 'quick_win'),
    big_bet: tasks.filter(t => t.quadrant === 'big_bet'),
    fill_in: tasks.filter(t => t.quadrant === 'fill_in'),
    time_sink: tasks.filter(t => t.quadrant === 'time_sink'),
  };

  const QuadrantBox = ({ title, subtitle, tasks, color }) => (
    <div style={{
      backgroundColor: colors.bgSurface,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: color, fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
          {title}
        </div>
        <div style={{ color: colors.textDim, fontSize: '11px' }}>
          {subtitle}
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary }}>
        {tasks.length}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <QuadrantBox title="QUICK WINS" subtitle="High impact · Low effort" tasks={quadrantTasks.quick_win} color={colors.accentGreen} />
        <QuadrantBox title="BIG BETS" subtitle="High impact · High effort" tasks={quadrantTasks.big_bet} color={colors.accentBlue} />
        <QuadrantBox title="FILL-INS" subtitle="Low impact · Low effort" tasks={quadrantTasks.fill_in} color={colors.textSecondary} />
        <QuadrantBox title="TIME SINKS" subtitle="Low impact · High effort" tasks={quadrantTasks.time_sink} color={colors.urgent} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setShowMatrix(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.bgHover}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Hide Matrix
        </button>
      </div>
    </div>
  );
};

// Scoring Legend Component
const ScoringLegend = ({ setShowLegend }) => (
  <div style={{
    backgroundColor: colors.bgSurface,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  }}>
    <div style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: '16px', fontSize: '14px' }}>
      How scoring works
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
      <div>
        <div style={{ color: colors.textDim, marginBottom: '8px' }}>Base score (Impact × Effort)</div>
        <div style={{ color: colors.textSecondary }}>Quick Win: 100</div>
        <div style={{ color: colors.textSecondary }}>Big Bet: 70</div>
        <div style={{ color: colors.textSecondary }}>Fill-in: 40</div>
        <div style={{ color: colors.textSecondary }}>Time Sink: 20</div>
      </div>
      <div>
        <div style={{ color: colors.textDim, marginBottom: '8px' }}>Deadline modifier</div>
        <div style={{ color: colors.textSecondary }}>Today: +30</div>
        <div style={{ color: colors.textSecondary }}>This week: +15</div>
        <div style={{ color: colors.textSecondary }}>This sprint: +0</div>
        <div style={{ color: colors.textSecondary }}>After sprint: −10</div>
      </div>
    </div>
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ color: colors.textDim, marginBottom: '8px', fontSize: '13px' }}>Tier thresholds</div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
        <span style={{ color: colors.accentGreen }}>Do Today: 90+</span>
        <span style={{ color: colors.accentBlue }}>Should Do: 60+</span>
        <span style={{ color: colors.textSecondary }}>Could Do: 30+</span>
        <span style={{ color: colors.textDim }}>Defer: &lt;30</span>
      </div>
    </div>
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button
        onClick={() => setShowLegend(false)}
        style={{
          padding: '10px 20px',
          backgroundColor: 'transparent',
          color: colors.textSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          fontSize: '13px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = colors.bgHover}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        Hide Scoring Guide
      </button>
    </div>
  </div>
);

// Completed Task Card Component
const CompletedTaskCard = ({ task, onUncomplete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDateTime = (date) => {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    const dayNum = d.getDate();

    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dayName}, ${monthName} ${dayNum} - ${time}`;
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        backgroundColor: isHovered ? colors.bgHover : colors.bgSurface,
        borderRadius: '8px',
        opacity: isHovered ? 0.8 : 0.6,
        transition: 'all 0.2s ease',
      }}
    >
      <div
        onClick={() => onUncomplete(task.id)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: colors.textDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.bgPrimary} strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          color: colors.textSecondary,
          fontSize: '15px',
          textDecoration: 'line-through',
        }}>
          {task.name}
        </span>
      </div>

      <div style={{
        fontSize: '13px',
        color: colors.textDim,
        flexShrink: 0,
      }}>
        {formatDateTime(task.completedAt)}
      </div>
    </div>
  );
};

// Completed Section Component
const CompletedSection = ({ tasks, onUncomplete }) => {
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: colors.textDim,
        }} />
        <span style={{
          color: colors.textDim,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '1.5px',
        }}>
          COMPLETED
        </span>
        <span style={{ color: colors.textDim, fontSize: '12px' }}>
          · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((task) => (
          <CompletedTaskCard key={task.id} task={task} onUncomplete={onUncomplete} />
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Screen
const DashboardScreen = ({ tasks, completedTasks, onComplete, onUncomplete, onAddTask, onClearAllData, onClearCompleted, onUpdateTask, onDeleteTask, onViewArchive, archivedTasksCount }) => {
  const [showMatrix, setShowMatrix] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showBottomClearConfirm, setShowBottomClearConfirm] = useState(false);
  const [showMenuClearConfirm, setShowMenuClearConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.dashboard-header-buttons')) {
        setShowMenu(false);
        setShowMenuClearConfirm(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu, showMenuClearConfirm]);

  // Add rank to each task based on position in sorted list
  const tasksWithRank = tasks.map((task, index) => ({
    ...task,
    rank: index + 1,
  }));

  const groupedTasks = {
    do_today: tasksWithRank.filter((t) => t.tier === 'do_today'),
    should_do: tasksWithRank.filter((t) => t.tier === 'should_do'),
    could_do: tasksWithRank.filter((t) => t.tier === 'could_do'),
    defer: tasksWithRank.filter((t) => t.tier === 'defer'),
  };

  const dueToday = tasksWithRank.filter(t => t.deadline === 'today').length;

  const formatDate = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    
    const suffix = (date) => {
      if (date > 3 && date < 21) return 'th';
      switch (date % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${dayName}, ${monthName} ${date}${suffix(date)}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgPrimary,
      padding: '40px',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="dashboard-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div className="dashboard-header-left">
            <div className="dashboard-title-row">
              <h1 style={{
                color: colors.textPrimary,
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '4px',
              }}>
                Your Day
              </h1>
              <div className="dashboard-date" style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
                {formatDate()}
              </div>
            </div>
            <div className="dashboard-task-count" style={{ color: colors.textSecondary, fontSize: '14px' }}>
              <span className="task-count-badge">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
              {dueToday > 0 && (
                <span className="task-count-badge" style={{ color: colors.urgent }}> · {dueToday} due today</span>
              )}
              {groupedTasks.do_today.length > 0 && (
                <span className="task-count-badge" style={{ color: colors.accentGreen }}> · {groupedTasks.do_today.length} to do now</span>
              )}
              {completedTasks.length > 0 && (
                <span className="task-count-badge"> · {completedTasks.length} done</span>
              )}
            </div>
          </div>
          <div className="dashboard-header-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
            {/* Three-dot menu button */}
            <button
              onClick={() => {
                setShowMenu(!showMenu);
                if (showMenu) {
                  // Reset confirmation when closing menu
                  setShowMenuClearConfirm(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '50%',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⋮
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="menu-backdrop"
                  onClick={() => {
                    setShowMenu(false);
                    setShowMenuClearConfirm(false);
                  }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 50,
                  }}
                />

                {/* Menu dropdown */}
                <div
                  className="dropdown-menu"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: '0',
                    backgroundColor: colors.bgSurface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    minWidth: '220px',
                    zIndex: 100,
                  }}
                >
                {!showMenuClearConfirm ? (
                  // Normal menu items
                  <>
                    <button
                      onClick={() => {
                        setShowMatrix(!showMatrix);
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        color: colors.textPrimary,
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                      }}
                    >
                      Show Matrix
                    </button>
                    {archivedTasksCount > 0 && (
                      <button
                        onClick={() => {
                          onViewArchive();
                          setShowMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          color: colors.textPrimary,
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        View Completed Archive
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowLegend(!showLegend);
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        color: colors.textPrimary,
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      How Scoring Works
                    </button>
                    <div style={{
                      height: '1px',
                      backgroundColor: colors.border,
                      margin: '4px 0',
                    }} />
                    <button
                      onClick={() => {
                        setShowMenuClearConfirm(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        color: colors.urgent,
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '0 0 8px 8px',
                      }}
                    >
                      Delete Incomplete
                    </button>
                  </>
                ) : (
                  // Confirmation dialog
                  <div style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>
                        ⚠️ Delete Incomplete?
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.5' }}>
                        This will permanently delete all incomplete tasks. This cannot be undone.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setShowMenuClearConfirm(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: 'transparent',
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.bgHover}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onClearAllData();
                          setShowMenuClearConfirm(false);
                          setShowMenu(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: colors.urgent,
                          color: colors.textPrimary,
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        Delete Incomplete
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            )}

            <button
              onClick={onAddTask}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: colors.accentGreen,
                color: colors.bgPrimary,
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '20px' }}>+</span>
              ADD TASK
            </button>
          </div>
        </div>

        {showMatrix && <MatrixView tasks={tasks} setShowMatrix={setShowMatrix} />}
        {showLegend && <ScoringLegend setShowLegend={setShowLegend} />}

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '24px' }}>
          <TierSection tier="do_today" tasks={groupedTasks.do_today} onComplete={onComplete} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          <TierSection tier="should_do" tasks={groupedTasks.should_do} onComplete={onComplete} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          <TierSection tier="could_do" tasks={groupedTasks.could_do} onComplete={onComplete} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          <TierSection tier="defer" tasks={groupedTasks.defer} onComplete={onComplete} onUpdate={onUpdateTask} onDelete={onDeleteTask} />

          <CompletedSection tasks={completedTasks} onUncomplete={onUncomplete} />
        </div>

        {tasks.length === 0 && completedTasks.length > 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '16px' }}>
              All clear. Nice work.
            </div>
          </div>
        )}

        {tasks.length === 0 && completedTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '16px' }}>
              No tasks yet. Add one to get started.
            </div>
          </div>
        )}

        {/* Clear/Delete options */}
        {(tasks.length > 0 || completedTasks.length > 0) && (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '24px' }}>
            {!showBottomClearConfirm ? (
              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center' }}>
                {completedTasks.length > 0 && (
                  <button
                    onClick={onClearCompleted}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: colors.textDim,
                      fontSize: '19.5px',
                      cursor: 'pointer',
                      padding: '8px 16px',
                    }}
                  >
                    Archive Completed
                  </button>
                )}
                <button
                  onClick={() => setShowBottomClearConfirm(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.textDim,
                    fontSize: '19.5px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                  }}
                >
                  Delete Incomplete
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  Are you sure? This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowBottomClearConfirm(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '20px',
                      color: colors.textSecondary,
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '8px 20px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowBottomClearConfirm(false);
                    }}
                    style={{
                      backgroundColor: colors.urgent,
                      border: 'none',
                      borderRadius: '20px',
                      color: colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 20px',
                    }}
                  >
                    Delete all
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Archive Screen
const ArchiveScreen = ({ archivedTasks, setArchivedTasks, onRestore, onPermanentDelete, onBack }) => {
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const handleDeleteAll = () => {
    setArchivedTasks([]);
    setShowDeleteAllConfirm(false);
    localStorage.setItem('tempo_archived_tasks', JSON.stringify([]));
  };

  // Group tasks by date
  const groupTasksByDate = (tasks) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      today: tasks.filter(t => new Date(t.archivedAt) >= today),
      yesterday: tasks.filter(t => {
        const archived = new Date(t.archivedAt);
        return archived >= yesterday && archived < today;
      }),
      thisWeek: tasks.filter(t => {
        const archived = new Date(t.archivedAt);
        return archived >= weekAgo && archived < yesterday;
      }),
      older: tasks.filter(t => new Date(t.archivedAt) < weekAgo),
    };
  };

  const groupedTasks = groupTasksByDate(archivedTasks);

  const ArchivedTaskCard = ({ task }) => {
    const [isHovered, setIsHovered] = useState(false);

    const formatDateTime = (date) => {
      const d = new Date(date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[d.getDay()];
      const monthName = months[d.getMonth()];
      const dayNum = d.getDate();

      const time = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return `${dayName}, ${monthName} ${dayNum} - ${time}`;
    };

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          backgroundColor: isHovered ? colors.bgHover : colors.bgSurface,
          borderRadius: '8px',
          borderLeft: `4px solid ${tierConfig[task.tier]?.color || colors.textDim}`,
          transition: 'all 0.2s ease',
          marginBottom: '8px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: colors.textPrimary,
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              {task.name}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '4px' }}>
              {(() => {
                const quadrant = getQuadrant(task.impact, task.effort);
                const quadrantLabels = {
                  quick_win: 'Quick Win',
                  big_bet: 'Big Bet',
                  fill_in: 'Fill In',
                  time_sink: 'Time Sink'
                };
                const impactLabel = task.impact === 'high' ? 'High Impact' : 'Low Impact';
                const effortLabel = task.effort === 'high' ? 'High Effort' : 'Low Effort';
                return `${quadrantLabels[quadrant]} · ${impactLabel}, ${effortLabel}`;
              })()}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '13px' }}>
              Completed: {formatDateTime(task.completedAt)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onRestore(task.id)}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: colors.accentBlue,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Restore to dashboard
          </button>
          {deletingTaskId !== task.id ? (
            <button
              onClick={() => setDeletingTaskId(task.id)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete permanently
            </button>
          ) : (
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDeletingTaskId(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onPermanentDelete(task.id);
                  setDeletingTaskId(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: colors.urgent,
                  color: colors.textPrimary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DateGroupSection = ({ title, tasks }) => {
    if (tasks.length === 0) return null;

    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: colors.textSecondary,
          }} />
          <span style={{
            color: colors.textSecondary,
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1.5px',
          }}>
            {title.toUpperCase()}
          </span>
          <span style={{ color: colors.textDim, fontSize: '12px' }}>
            · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <div>
          {tasks.map(task => (
            <ArchivedTaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgPrimary,
      padding: '40px',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
        </div>

        <h1 style={{
          color: colors.textPrimary,
          fontSize: '32px',
          fontWeight: 700,
          margin: 0,
          marginBottom: '8px',
        }}>
          Completed Archive
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
            {archivedTasks.length} {archivedTasks.length === 1 ? 'task' : 'tasks'} archived
          </div>

          {archivedTasks.length > 0 && (
            !showDeleteAllConfirm ? (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: colors.red,
                  border: `1px solid ${colors.red}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete All
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
              }}>
                <span style={{ color: colors.textSecondary, fontSize: '13px' }}>
                  ⚠️ Delete all archived tasks?
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: colors.textSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: colors.red,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Delete All
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Content */}
        {archivedTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 20px',
            color: colors.textSecondary,
            fontSize: '16px',
          }}>
            No archived tasks yet. Cleared completed tasks will appear here.
          </div>
        ) : (
          <>
            <DateGroupSection title="Today" tasks={groupedTasks.today} />
            <DateGroupSection title="Yesterday" tasks={groupedTasks.yesterday} />
            <DateGroupSection title="This Week" tasks={groupedTasks.thisWeek} />
            <DateGroupSection title="Older" tasks={groupedTasks.older} />
          </>
        )}
      </div>
    </div>
  );
};

// Daily Review Modal Component
const DailyReviewModal = ({ tasks, onComplete, onReAdd, onDismiss, onDismissAll }) => {
  const [reviewedTasks, setReviewedTasks] = useState(new Set());
  const [updatingDeadlineFor, setUpdatingDeadlineFor] = useState(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const handleComplete = (taskId) => {
    setReviewedTasks(new Set([...reviewedTasks, taskId]));
    onComplete(taskId);
  };

  const handleKeepTask = (taskId) => {
    setReviewedTasks(new Set([...reviewedTasks, taskId]));
    onReAdd(taskId, null); // null means keep current deadline
  };

  const handleUpdateDeadline = (taskId, newDeadline) => {
    setReviewedTasks(new Set([...reviewedTasks, taskId]));
    setUpdatingDeadlineFor(null);
    onReAdd(taskId, newDeadline);
  };

  const handleDismiss = (taskId) => {
    setReviewedTasks(new Set([...reviewedTasks, taskId]));
    setConfirmDeleteTaskId(null);
    onDismiss(taskId);
  };

  const handleDismissAll = () => {
    setConfirmDeleteAll(false);
    onDismissAll();
  };

  const remainingTasks = tasks.filter(t => !reviewedTasks.has(t.id));

  const deadlineOptions = [
    { value: 'today', label: 'Today', desc: 'Must be done today' },
    { value: 'this_week', label: 'This week', desc: 'Due within the next few days' },
    { value: 'this_sprint', label: 'This sprint', desc: 'Due before the sprint ends' },
    { value: 'after_sprint', label: 'After this sprint / No deadline', desc: 'Can wait or has no hard deadline' },
  ];

  if (remainingTasks.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '40px',
    }}>
      <div style={{
        backgroundColor: colors.bgSurface,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <h2 style={{
          color: colors.textPrimary,
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '12px',
          margin: 0,
        }}>
          Welcome back!
        </h2>
        <p style={{
          color: colors.textSecondary,
          fontSize: '16px',
          marginBottom: '24px',
        }}>
          You have {remainingTasks.length} incomplete {remainingTasks.length === 1 ? 'task' : 'tasks'} from yesterday. What would you like to do with them?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {remainingTasks.map(task => (
            <div
              key={task.id}
              style={{
                backgroundColor: colors.bgPrimary,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{
                color: colors.textPrimary,
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
              }}>
                {task.name}
              </div>
              <div style={{
                color: colors.textSecondary,
                fontSize: '14px',
                marginBottom: '12px',
              }}>
                {task.reason}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="modal-button-row" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleComplete(task.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: colors.accentGreen,
                      color: colors.bgPrimary,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark complete
                  </button>
                  <button
                    onClick={() => handleKeepTask(task.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: colors.accentBlue,
                      color: colors.textPrimary,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Keep task
                  </button>
                  <button
                    onClick={() => setUpdatingDeadlineFor(task.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: updatingDeadlineFor === task.id ? colors.bgHover : 'transparent',
                      color: colors.accentBlue,
                      border: `1px solid ${colors.accentBlue}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Keep task - update deadline
                  </button>
                  {confirmDeleteTaskId !== task.id ? (
                    <button
                      onClick={() => setConfirmDeleteTaskId(task.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete task
                    </button>
                  ) : (
                    <div className="modal-button-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setConfirmDeleteTaskId(null)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDismiss(task.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: colors.urgent,
                          color: colors.textPrimary,
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline deadline selector */}
                {updatingDeadlineFor === task.id && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 600 }}>
                      Select new deadline:
                    </div>
                    {deadlineOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleUpdateDeadline(task.id, opt.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: task.deadline === opt.value ? colors.bgHover : colors.bgSurface,
                          border: `2px solid ${task.deadline === opt.value ? colors.accentGreen : colors.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '14px' }}>
                          {opt.label}
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: '13px', marginTop: '2px' }}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!confirmDeleteAll ? (
          <button
            onClick={() => setConfirmDeleteAll(true)}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Delete all tasks and start fresh
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
              Are you sure? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  color: colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDismissAll}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: colors.urgent,
                  border: 'none',
                  borderRadius: '12px',
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

export default function PriorityApp() {
  const [screen, setScreen] = useState('welcome');
  const [tasks, setTasks] = useState([]);
  const [rankedTasks, setRankedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDailyReview, setShowDailyReview] = useState(false);
  const [tasksToReview, setTasksToReview] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('tempo_tasks');
      const savedCompletedTasks = localStorage.getItem('tempo_completed_tasks');
      const hasVisited = localStorage.getItem('tempo_has_visited');
      const lastLoginDate = localStorage.getItem('tempo_last_login_date');

      // Check if it's a new day
      const today = new Date().toDateString();
      const isNewDay = lastLoginDate && lastLoginDate !== today;

      // Debug logging
      console.log('Daily Review Debug:', {
        today,
        lastLoginDate,
        isNewDay,
        hasTasks: savedTasks ? JSON.parse(savedTasks).length : 0,
        hasVisited,
      });

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        // Restore Date objects
        const restored = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));

        // If it's a new day and there are tasks, show review modal
        if (isNewDay && restored.length > 0 && hasVisited) {
          // Get yesterday's date to check which tasks were already reviewed
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const reviewedYesterday = getReviewedTasksForDate(yesterday);

          // Filter out tasks that were already reviewed
          const tasksNotReviewed = restored.filter(t => !reviewedYesterday.has(t.id));

          if (tasksNotReviewed.length > 0) {
            const rankedForReview = rankTasks(tasksNotReviewed);
            setTasksToReview(rankedForReview);
            setShowDailyReview(true);
          } else {
            // All tasks were already reviewed, safe to update timestamp
            localStorage.setItem('tempo_last_login_date', today);
          }
        }

        setTasks(restored);
        setRankedTasks(rankTasks(restored));
      }

      if (savedCompletedTasks) {
        const parsed = JSON.parse(savedCompletedTasks);
        const restored = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: new Date(t.completedAt),
        }));
        setCompletedTasks(restored);
      }

      const savedArchivedTasks = localStorage.getItem('tempo_archived_tasks');
      if (savedArchivedTasks) {
        const parsed = JSON.parse(savedArchivedTasks);
        const restored = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: new Date(t.completedAt),
          archivedAt: new Date(t.archivedAt),
        }));
        setArchivedTasks(restored);
      }

      // Clean up old review data (entries older than 30 days)
      cleanupOldReviewData();

      // Only update last login date if we're NOT showing the review modal
      // (it will be updated after the user completes the review)
      const shouldShowReview = isNewDay && savedTasks && JSON.parse(savedTasks).length > 0 && hasVisited;
      if (!shouldShowReview) {
        localStorage.setItem('tempo_last_login_date', today);
      }

      // Skip welcome screen if user has visited before
      if (hasVisited) {
        if (savedTasks && JSON.parse(savedTasks).length > 0) {
          setScreen('dashboard');
        } else {
          setScreen('empty');
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('tempo_tasks', JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save tasks:', e);
      }
    }
  }, [tasks, isLoaded]);

  // Save completed tasks to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('tempo_completed_tasks', JSON.stringify(completedTasks));
      } catch (e) {
        console.error('Failed to save completed tasks:', e);
      }
    }
  }, [completedTasks, isLoaded]);

  // Save archived tasks to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('tempo_archived_tasks', JSON.stringify(archivedTasks));
      } catch (e) {
        console.error('Failed to save archived tasks:', e);
      }
    }
  }, [archivedTasks, isLoaded]);

  // Mark that user has visited (after they leave welcome screen)
  useEffect(() => {
    if (isLoaded && screen !== 'welcome') {
      localStorage.setItem('tempo_has_visited', 'true');
    }
  }, [screen, isLoaded]);

  const handleAddTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      createdAt: new Date(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleDoneAdding = () => {
    const ranked = rankTasks(tasks);
    setRankedTasks(ranked);
    setScreen('dashboard');
  };

  const handleComplete = (taskId) => {
    const taskToComplete = rankedTasks.find(t => t.id === taskId);
    if (taskToComplete) {
      setCompletedTasks([
        { ...taskToComplete, completedAt: new Date() },
        ...completedTasks,
      ]);
    }
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setRankedTasks(rankTasks(updatedTasks));
  };

  const handleUncomplete = (taskId) => {
    const taskToRestore = completedTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      const { completedAt, quadrant, tier, score, reason, ...originalTask } = taskToRestore;
      const updatedTasks = [...tasks, originalTask];
      setTasks(updatedTasks);
      setRankedTasks(rankTasks(updatedTasks));
    }
    setCompletedTasks(completedTasks.filter(t => t.id !== taskId));
  };

  const handleAddFromDashboard = () => {
    setScreen('addTask');
  };

  const handleViewArchive = () => {
    setScreen('archive');
  };

  const handleBackFromArchive = () => {
    setScreen('dashboard');
  };

  const handleRestoreTask = (taskId) => {
    const taskToRestore = archivedTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      const { archivedAt, ...restoredTask } = taskToRestore;
      setCompletedTasks([restoredTask, ...completedTasks]);
      setArchivedTasks(archivedTasks.filter(t => t.id !== taskId));
    }
  };

  const handlePermanentDelete = (taskId) => {
    setArchivedTasks(archivedTasks.filter(t => t.id !== taskId));
  };

  const handleUpdateTask = (taskId, updates) => {
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);
    setRankedTasks(rankTasks(updatedTasks));
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setRankedTasks(rankTasks(updatedTasks));
  };

  const handleClearAllData = () => {
    // Only clear active tasks, not completed or archived
    setTasks([]);
    setRankedTasks([]);
    localStorage.removeItem('tempo_tasks');
  };

  const handleClearCompleted = () => {
    // Move completed tasks to archive with archivedAt timestamp
    const tasksToArchive = completedTasks.map(task => ({
      ...task,
      archivedAt: new Date(),
    }));
    setArchivedTasks([...tasksToArchive, ...archivedTasks]);
    setCompletedTasks([]);
  };

  // Daily review handlers
  const handleReviewComplete = (taskId) => {
    const taskToComplete = tasksToReview.find(t => t.id === taskId);
    if (taskToComplete) {
      setCompletedTasks([
        { ...taskToComplete, completedAt: new Date() },
        ...completedTasks,
      ]);
    }
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setRankedTasks(rankTasks(updatedTasks));

    // Add to reviewed tasks in localStorage
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    addToReviewedTasks(taskId, yesterday);

    // Check if all tasks have been reviewed
    const remainingToReview = tasksToReview.filter(t => t.id !== taskId);
    if (remainingToReview.length === 0) {
      setShowDailyReview(false);
      setTasksToReview([]);
      localStorage.setItem('tempo_last_login_date', new Date().toDateString());
    }
  };

  const handleReviewReAdd = (taskId, newDeadline) => {
    // If newDeadline is provided, update the task's deadline
    if (newDeadline !== null) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, deadline: newDeadline } : t
      );
      setTasks(updatedTasks);
      setRankedTasks(rankTasks(updatedTasks));
    }
    // Otherwise, task stays in the list as-is

    // Add to reviewed tasks in localStorage
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    addToReviewedTasks(taskId, yesterday);

    // Check if all tasks have been reviewed
    const remainingToReview = tasksToReview.filter(t => t.id !== taskId);
    if (remainingToReview.length === 0) {
      setShowDailyReview(false);
      setTasksToReview([]);
      localStorage.setItem('tempo_last_login_date', new Date().toDateString());
    }
  };

  const handleReviewDismiss = (taskId) => {
    // Remove from tasks without marking complete
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setRankedTasks(rankTasks(updatedTasks));

    // Add to reviewed tasks in localStorage
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    addToReviewedTasks(taskId, yesterday);

    // Check if all tasks have been reviewed
    const remainingToReview = tasksToReview.filter(t => t.id !== taskId);
    if (remainingToReview.length === 0) {
      setShowDailyReview(false);
      setTasksToReview([]);
      localStorage.setItem('tempo_last_login_date', new Date().toDateString());
    }
  };

  const handleReviewDismissAll = () => {
    // Mark all current tasks as reviewed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    tasksToReview.forEach(task => {
      addToReviewedTasks(task.id, yesterday);
    });

    // Clear all tasks without marking them complete
    setTasks([]);
    setRankedTasks([]);
    setShowDailyReview(false);
    setTasksToReview([]);
    localStorage.setItem('tempo_last_login_date', new Date().toDateString());
  };

  // Don't render until localStorage is loaded
  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{ color: colors.textSecondary }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {screen === 'welcome' && (
        <WelcomeScreen onContinue={() => setScreen('empty')} />
      )}

      {screen === 'empty' && (
        <EmptyState onAddTask={() => setScreen('addTask')} />
      )}

      {screen === 'addTask' && (
        <AddTaskScreen
          taskCount={tasks.length}
          onSave={handleAddTask}
          onDone={handleDoneAdding}
        />
      )}

      {screen === 'dashboard' && (
        <DashboardScreen
          tasks={rankedTasks}
          completedTasks={completedTasks}
          onComplete={handleComplete}
          onUncomplete={handleUncomplete}
          onAddTask={handleAddFromDashboard}
          onClearAllData={handleClearAllData}
          onClearCompleted={handleClearCompleted}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onViewArchive={handleViewArchive}
          archivedTasksCount={archivedTasks.length}
        />
      )}

      {screen === 'archive' && (
        <ArchiveScreen
          archivedTasks={archivedTasks}
          setArchivedTasks={setArchivedTasks}
          onRestore={handleRestoreTask}
          onPermanentDelete={handlePermanentDelete}
          onBack={handleBackFromArchive}
        />
      )}

      {showDailyReview && tasksToReview.length > 0 && (
        <DailyReviewModal
          tasks={tasksToReview}
          onComplete={handleReviewComplete}
          onReAdd={handleReviewReAdd}
          onDismiss={handleReviewDismiss}
          onDismissAll={handleReviewDismissAll}
        />
      )}
    </div>
  );
}
