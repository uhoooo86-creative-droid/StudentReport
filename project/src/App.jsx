import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth.jsx'

// ─────────────────────────────────────────
// 상수 & 데이터 정의
// ─────────────────────────────────────────
const DOMAINS = [
  { id: 'self_awareness', label: '자기인식', icon: '🔍', color: '#4A7C59', light: '#EAF3ED',
    items: ['감정 알아차리기', '자신의 생각 표현하기', '자신의 강점·약점 인식', '감정에 이름 붙이기'] },
  { id: 'self_regulation', label: '자기조절', icon: '⚖️', color: '#2D6A9F', light: '#E8F0F9',
    items: ['기다리기·차례 지키기', '감정 조절하기', '규칙 지키기', '충동 조절하기'] },
  { id: 'social_awareness', label: '사회적 인식', icon: '🌐', color: '#7B5EA7', light: '#F1ECF9',
    items: ['친구 감정 이해하기', '배려하는 행동', '공감 표현하기', '다양성 존중하기'] },
  { id: 'relationship_skills', label: '관계기술', icon: '🤝', color: '#C0622F', light: '#FAF0EB',
    items: ['인사하기·친근감 표현', '놀이 참여하기', '협동하여 목표 달성', '갈등 해결하기'] },
  { id: 'decision_making', label: '책임 있는 의사결정', icon: '🎯', color: '#8B7A1A', light: '#F9F6E8',
    items: ['문제 상황 판단하기', '도움 요청하기', '선택 결과 이해하기', '안전한 행동 선택'] },
]

const PHASES = [
  { id: 'initial', label: '학기 초', icon: '🌱' },
  { id: 'semester1', label: '1학기 평가', icon: '📋' },
  { id: 'semester2', label: '2학기 평가', icon: '📝' },
  { id: 'final', label: '연말 종합', icon: '🏁' },
]

const SCORE_LABELS = ['미관찰', '초기단계', '발달중', '안정적', '능숙']
const SCORE_COLORS = ['#ccc', '#E8A87C', '#F0C96A', '#7EC8A4', '#4A7C59']

const C = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E2E8F0',
  primary: '#1A3A5C', accent: '#4A7C59', text: '#1E2A38', muted: '#64748B', light: '#F0F4F8',
}

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────
function initScores() {
  const s = {}
  DOMAINS.forEach((d) => { s[d.id] = {}; d.items.forEach((_, i) => { s[d.id][i] = 0 }) })
  return s
}

function domainAvg(scores, domainId) {
  const d = DOMAINS.find((x) => x.id === domainId)
  const vals = d.items.map((_, i) => scores?.[domainId]?.[i] ?? 0)
  const filled = vals.filter((v) => v > 0)
  if (!filled.length) return 0
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 25)
}

function RadarChart({ data }) {
  const cx = 140, cy = 140, r = 90
  const n = data.length
  const pts = data.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
  const valuePts = data.map((d, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const rv = (d.value / 100) * r
    return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`
  })
  const rings = [25, 50, 75, 100]
  return (
    <svg viewBox="0 0 280 280" style={{ width: '100%', maxWidth: 280 }}>
      {rings.map((ring) =>
        <polygon key={ring}
          points={pts.map((_, i) => {
            const a = (i / n) * 2 * Math.PI - Math.PI / 2
            const rv = (ring / 100) * r
            return `${cx + rv * Math.cos(a)},${cy + rv * Math.sin(a)}`
          }).join(' ')}
          fill="none" stroke="#E2E8F0" strokeWidth="1" />
      )}
      {pts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth="1" />)}
      <polygon points={valuePts.join(' ')} fill="rgba(74,124,89,0.18)" stroke="#4A7C59" strokeWidth="2" />
      {data.map((d, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const lx = cx + (r + 24) * Math.cos(angle)
        const ly = cy + (r + 24) * Math.sin(angle)
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 10, fill: C.primary, fontWeight: 600 }}>{d.label}</text>
      })}
      {data.map((d, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const rv = (d.value / 100) * r
        const px = cx + rv * Math.cos(angle)
        const py = cy + rv * Math.sin(angle)
        return <circle key={i} cx={px} cy={py} r={4} fill="#4A7C59" />
      })}
    </svg>
  )
}

// ─────────────────────────────────────────
// 평가 입력 컴포넌트
// ─────────────────────────────────────────
function ScoreItem({ domain, idx, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{domain.items[idx]}</span>
        <span style={{ fontSize: 12, color: SCORE_COLORS[value], fontWeight: 700 }}>{SCORE_LABELS[value]}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((v) => (
          <button key={v} onClick={() => onChange(v)}
            style={{
              flex: 1, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: value === v ? SCORE_COLORS[v] : C.border,
              color: value === v ? '#fff' : C.muted, fontSize: 10, fontWeight: 700, transition: 'all .15s',
            }}>{v === 0 ? '—' : v}</button>
        ))}
      </div>
    </div>
  )
}

function PhaseForm({ scores, setScores, notes, setNotes, childName }) {
  const [openDomain, setOpenDomain] = useState(null)
  return (
    <div>
      <div style={{ background: '#E8F0F9', borderRadius: 12, padding: '14px 16px', marginBottom: 16, borderLeft: `4px solid ${C.primary}` }}>
        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          {childName || '아이'}의 기관 내 관찰 내용을 바탕으로 5대 영역별 평가를 작성해주세요.
        </p>
      </div>

      {DOMAINS.map((d) => {
        const avg = domainAvg(scores, d.id)
        const isOpen = openDomain === d.id
        return (
          <div key={d.id} style={{ border: `1px solid ${isOpen ? d.color : C.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden', transition: 'border-color .2s' }}>
            <button onClick={() => setOpenDomain(isOpen ? null : d.id)}
              style={{ width: '100%', padding: '14px 16px', background: isOpen ? d.light : C.surface, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{d.icon}</span>
                <span style={{ fontWeight: 700, color: d.color, fontSize: 15 }}>{d.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {avg > 0 && <div style={{ background: d.color, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 800 }}>{avg}점</div>}
                <span style={{ color: C.muted, fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: '16px', background: '#FAFAFA', borderTop: `1px solid ${d.color}30` }}>
                {d.items.map((_, idx) => (
                  <ScoreItem key={idx} domain={d} idx={idx}
                    value={scores[d.id]?.[idx] ?? 0}
                    onChange={(v) => setScores((prev) => ({ ...prev, [d.id]: { ...prev[d.id], [idx]: v } }))} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>관찰 메모 (선택)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="특이사항, 성장 에피소드, 지원 방향 등 자유롭게 작성하세요."
          style={{ width: '100%', minHeight: 80, borderRadius: 10, border: `1px solid ${C.border}`, padding: '10px 12px', fontSize: 13, color: C.text, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// AI 리포트 생성
// ─────────────────────────────────────────
async function generateReport(childName, allData) {
  const summaryLines = DOMAINS.map((d) => {
    const avgs = allData.map((pd, i) => `${PHASES[i].label}: ${domainAvg(pd.scores, d.id)}점`).join(', ')
    return `${d.label}(${d.icon}): ${avgs}`
  }).join('\n')

  const prompt = `당신은 유아·아동 사회정서발달 전문 교육 평가사입니다.
아이 이름: ${childName || 'OO'}

아래는 학기별 5대 사회·정서 발달 영역 점수(0~100점)입니다:
${summaryLines}

다음 구조로 전문적이고 따뜻한 성장 보고서를 작성하세요:
1. 전반적 성장 요약 (2문장)
2. 강점 영역 서술 (1~2문장)
3. 성장이 관찰된 영역 서술 (1~2문장)
4. 향후 지원 방향 제안 (1~2문장)

- 아이 이름 대신 "OO"를 사용하세요
- 동물 유형, MBTI, 성격유형 표현은 절대 사용하지 마세요
- 전문적이고 교육적인 언어를 사용하세요
- 600자 내외로 작성하세요`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text ?? '리포트를 생성할 수 없습니다.'
}

// ─────────────────────────────────────────
// 결과 화면
// ─────────────────────────────────────────
function ResultScreen({ childName, allData, onBack, onSaveReport }) {
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const radarData = DOMAINS.map((d) => {
    const scores = allData.map((pd) => domainAvg(pd.scores, d.id)).filter((v) => v > 0)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { label: d.label, value: avg, color: d.color }
  })

  const handleGenerate = async () => {
    setLoading(true)
    const r = await generateReport(childName, allData)
    setReport(r)
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveReport(report)
    setSaving(false)
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← 입력으로 돌아가기</button>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, color: C.primary, fontWeight: 800 }}>{childName || '아이'} · 사회·정서 성장 포트폴리오</h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>학기별 5대 영역 통합 분석</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <RadarChart data={radarData} />
      </div>

      <div style={{ background: C.surface, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <p style={{ fontWeight: 700, color: C.primary, fontSize: 15, marginBottom: 14 }}>5대 영역 점수 현황</p>
        {DOMAINS.map((d) => {
          const phaseScores = allData.map((pd, i) => ({ phase: PHASES[i].label, val: domainAvg(pd.scores, d.id) }))
          const latest = [...phaseScores].reverse().find((s) => s.val > 0)
          const score = latest?.val ?? 0
          return (
            <div key={d.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.icon} {d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{score}점</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: d.color, width: `${score}%`, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {phaseScores.filter((s) => s.val > 0).map((s) => (
                  <span key={s.phase} style={{ fontSize: 10, color: d.color, background: d.light, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>{s.phase}: {s.val}점</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: C.surface, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontWeight: 700, color: C.primary, fontSize: 15 }}>📄 성장 서술 리포트</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleGenerate} disabled={loading}
              style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '생성 중...' : report ? '재생성' : 'AI 리포트 생성'}
            </button>
            {report && (
              <button onClick={handleSave} disabled={saving}
                style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? '저장 중...' : '리포트 저장'}
              </button>
            )}
          </div>
        </div>
        {report ? (
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report}</p>
        ) : (
          <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>위 버튼을 눌러 AI 성장 리포트를 생성하세요.</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 아동 목록 화면
// ─────────────────────────────────────────
function ChildrenList({ children, onSelect, onAdd, loading }) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) return
    await onAdd(name.trim(), birth)
    setName(''); setBirth(''); setShowAdd(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>👶 아동 목록</h2>
        <button onClick={() => setShowAdd((s) => !s)}
          style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + 아동 등록
        </button>
      </div>

      {showAdd && (
        <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="아이 이름"
            style={{ width: '100%', borderRadius: 10, border: `1.5px solid ${C.border}`, padding: '10px 14px', fontSize: 14, marginBottom: 10, fontFamily: 'inherit' }} />
          <input value={birth} onChange={(e) => setBirth(e.target.value)} type="date"
            style={{ width: '100%', borderRadius: 10, border: `1.5px solid ${C.border}`, padding: '10px 14px', fontSize: 14, marginBottom: 10, fontFamily: 'inherit' }} />
          <button onClick={handleAdd} style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>등록</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: C.muted, padding: '40px 0' }}>불러오는 중...</p>
      ) : children.length === 0 ? (
        <p style={{ textAlign: 'center', color: C.muted, padding: '40px 0', fontSize: 13 }}>등록된 아동이 없습니다. 위 버튼으로 추가해주세요.</p>
      ) : (
        children.map((c) => (
          <button key={c.id} onClick={() => onSelect(c)}
            style={{ width: '100%', textAlign: 'left', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.child_name}</p>
              {c.birth_date && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.birth_date}</p>}
            </div>
            <span style={{ color: C.muted }}>→</span>
          </button>
        ))
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// 평가 화면 (선택된 아동)
// ─────────────────────────────────────────
function AssessmentView({ child, profile, onBack }) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseData, setPhaseData] = useState(PHASES.map(() => ({ scores: initScores(), notes: '', id: null })))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    loadAssessments()
  }, [child.id])

  const loadAssessments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('child_id', child.id)

    if (!error && data) {
      const next = PHASES.map((p) => {
        const existing = data.find((d) => d.phase === p.id)
        return existing
          ? { scores: existing.scores || initScores(), notes: existing.notes || '', id: existing.id }
          : { scores: initScores(), notes: '', id: null }
      })
      setPhaseData(next)
    }
    setLoading(false)
  }

  const updateScores = (s) => setPhaseData((prev) => prev.map((p, i) => i === currentPhase ? { ...p, scores: s } : p))
  const updateNotes = (n) => setPhaseData((prev) => prev.map((p, i) => i === currentPhase ? { ...p, notes: n } : p))

  const handleSave = async () => {
    setSaving(true)
    const pd = phaseData[currentPhase]
    const payload = {
      school_id: profile.school_id,
      child_id: child.id,
      phase: PHASES[currentPhase].id,
      scores: pd.scores,
      notes: pd.notes,
      created_by: profile.id,
    }
    if (pd.id) {
      await supabase.from('assessments').update(payload).eq('id', pd.id)
    } else {
      const { data } = await supabase.from('assessments').insert(payload).select().single()
      if (data) setPhaseData((prev) => prev.map((p, i) => i === currentPhase ? { ...p, id: data.id } : p))
    }
    setSaving(false)
  }

  const handleSaveReport = async (content) => {
    await supabase.from('reports').insert({
      school_id: profile.school_id,
      child_id: child.id,
      content,
    })
  }

  const completedPhases = phaseData.filter((pd) =>
    DOMAINS.some((d) => Object.values(pd.scores[d.id] ?? {}).some((v) => v > 0))
  ).length

  if (showResult) {
    return (
      <div>
        <ResultScreen childName={child.child_name} allData={phaseData} onBack={() => setShowResult(false)} onSaveReport={handleSaveReport} />
      </div>
    )
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← 아동 목록으로</button>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 16 }}>{child.child_name}</h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: C.muted, padding: '40px 0' }}>불러오는 중...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {PHASES.map((p, i) => {
              const done = DOMAINS.some((d) => Object.values(phaseData[i].scores[d.id] ?? {}).some((v) => v > 0))
              return (
                <button key={p.id} onClick={() => setCurrentPhase(i)}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                    border: `2px solid ${currentPhase === i ? C.primary : C.border}`,
                    background: currentPhase === i ? C.primary : done ? '#EAF3ED' : C.surface,
                    color: currentPhase === i ? '#fff' : done ? C.accent : C.muted,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>{p.icon} {p.label} {done ? '✓' : ''}</button>
              )
            })}
          </div>

          <PhaseForm
            scores={phaseData[currentPhase].scores}
            setScores={updateScores}
            notes={phaseData[currentPhase].notes}
            setNotes={updateNotes}
            childName={child.child_name}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? '저장 중...' : '💾 이 단계 저장'}
            </button>
          </div>

          {completedPhases > 0 && (
            <button onClick={() => setShowResult(true)}
              style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: `2px solid ${C.primary}`, background: 'transparent', color: C.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              📊 포트폴리오 보기 ({completedPhases}단계 완료)
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// 메인 앱
// ─────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadProfile()
    else setProfile(null)
  }, [session])

  useEffect(() => {
    if (profile) loadChildren()
  }, [profile])

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (!error) setProfile(data)
  }

  const loadChildren = async () => {
    setChildrenLoading(true)
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setChildren(data || [])
    setChildrenLoading(false)
  }

  const handleAddChild = async (name, birth) => {
    const { data, error } = await supabase
      .from('children')
      .insert({ school_id: profile.school_id, child_name: name, birth_date: birth || null })
      .select().single()
    if (!error) setChildren((prev) => [data, ...prev])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSelectedChild(null)
  }

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>로딩 중...</div>
  }

  if (!session) return <Auth />

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20, textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 14 }}>
          프로필 정보를 불러오지 못했습니다.<br/>
          이메일 인증 후 다시 로그인해주세요.
        </p>
        <button onClick={handleLogout} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>로그아웃</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      <div style={{ background: C.primary, color: '#fff', padding: '20px 20px 16px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>사회·정서 발달 성장평가</p>
            <h1 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>우리 아이 사회성 성장 포트폴리오</h1>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>로그아웃</button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 8 }}>{profile.name || '선생님'} 님</p>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px' }}>
        {selectedChild ? (
          <AssessmentView child={selectedChild} profile={profile} onBack={() => setSelectedChild(null)} />
        ) : (
          <ChildrenList children={children} onSelect={setSelectedChild} onAdd={handleAddChild} loading={childrenLoading} />
        )}
      </div>
    </div>
  )
}
