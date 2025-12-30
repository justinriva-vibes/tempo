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
  return `${quadrantLabels[quadrant]} · ${impactText} · ${effortText} · ${deadlineText[task.deadline]}`;
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
    if (b.score !== a.score) return b.score - a.score;
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
const TaskCard = ({ task, onComplete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const tier = tierConfig[task.tier];

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => onComplete?.(task.id), 300);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: isHovered ? colors.bgHover : colors.bgSurface,
        borderRadius: '8px',
        borderLeft: `4px solid ${tier.color}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateX(4px)' : 'none',
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      {/* Rank number */}
      <div style={{
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
        }}
      >
        {isCompleted && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.bgPrimary} strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
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
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          {task.reason}
        </div>
      </div>

      <div style={{
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
  );
};

// Tier Section Component
const TierSection = ({ tier, tasks, onComplete }) => {
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
          <TaskCard key={task.id} task={task} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
};

// Matrix Visualization Component
const MatrixView = ({ tasks }) => {
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '32px',
    }}>
      <QuadrantBox title="QUICK WINS" subtitle="High impact · Low effort" tasks={quadrantTasks.quick_win} color={colors.accentGreen} />
      <QuadrantBox title="BIG BETS" subtitle="High impact · High effort" tasks={quadrantTasks.big_bet} color={colors.accentBlue} />
      <QuadrantBox title="FILL-INS" subtitle="Low impact · Low effort" tasks={quadrantTasks.fill_in} color={colors.textSecondary} />
      <QuadrantBox title="TIME SINKS" subtitle="Low impact · High effort" tasks={quadrantTasks.time_sink} color={colors.urgent} />
    </div>
  );
};

// Scoring Legend Component
const ScoringLegend = () => (
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
  </div>
);

// Completed Task Card Component
const CompletedTaskCard = ({ task, onUncomplete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
        {formatTime(task.completedAt)}
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
const DashboardScreen = ({ tasks, completedTasks, onComplete, onUncomplete, onAddTask, onClearAllData }) => {
  const [showMatrix, setShowMatrix] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              color: colors.textPrimary,
              fontSize: '32px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '4px',
            }}>
              Your Day
            </h1>
            <div style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
              {formatDate()}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              {dueToday > 0 && (
                <span style={{ color: colors.urgent }}> · {dueToday} due today</span>
              )}
              {groupedTasks.do_today.length > 0 && (
                <span style={{ color: colors.accentGreen }}> · {groupedTasks.do_today.length} to do now</span>
              )}
              {completedTasks.length > 0 && (
                <span> · {completedTasks.length} done</span>
              )}
            </div>
          </div>
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

        {/* Toggle buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            style={{
              padding: '8px 16px',
              backgroundColor: showMatrix ? colors.bgHover : 'transparent',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {showMatrix ? 'Hide matrix' : 'Show matrix'}
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            style={{
              padding: '8px 16px',
              backgroundColor: showLegend ? colors.bgHover : 'transparent',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {showLegend ? 'Hide scoring' : 'How scoring works'}
          </button>
        </div>

        {showMatrix && <MatrixView tasks={tasks} />}
        {showLegend && <ScoringLegend />}

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '24px' }}>
          <TierSection tier="do_today" tasks={groupedTasks.do_today} onComplete={onComplete} />
          <TierSection tier="should_do" tasks={groupedTasks.should_do} onComplete={onComplete} />
          <TierSection tier="could_do" tasks={groupedTasks.could_do} onComplete={onComplete} />
          <TierSection tier="defer" tasks={groupedTasks.defer} onComplete={onComplete} />
          
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

        {/* Clear data option */}
        {(tasks.length > 0 || completedTasks.length > 0) && (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '24px' }}>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.textDim,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
              >
                Clear all tasks
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  Are you sure? This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowClearConfirm(false)}
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
                      setShowClearConfirm(false);
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
                    Clear all
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

// ==================== MAIN APP ====================

export default function PriorityApp() {
  const [screen, setScreen] = useState('welcome');
  const [tasks, setTasks] = useState([]);
  const [rankedTasks, setRankedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('tempo_tasks');
      const savedCompletedTasks = localStorage.getItem('tempo_completed_tasks');
      const hasVisited = localStorage.getItem('tempo_has_visited');
      
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        // Restore Date objects
        const restored = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
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

  const handleClearAllData = () => {
    setTasks([]);
    setRankedTasks([]);
    setCompletedTasks([]);
    localStorage.removeItem('tempo_tasks');
    localStorage.removeItem('tempo_completed_tasks');
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
        />
      )}
    </div>
  );
}
