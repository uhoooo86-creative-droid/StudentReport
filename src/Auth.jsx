import { useState } from 'react'
import { supabase } from './supabaseClient'

const C = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E2E8F0',
  primary: '#1A3A5C', accent: '#4A7C59', text: '#1E2A38', muted: '#64748B',
}

const inputStyle = {
  width: '100%', borderRadius: 10, border: `1.5px solid ${C.border}`,
  padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none',
  fontFamily: 'inherit', marginBottom: 12,
}

const btnStyle = (enabled) => ({
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: enabled ? C.primary : C.border, color: '#fff',
  fontSize: 15, fontWeight: 800, cursor: enabled ? 'pointer' : 'not-allowed',
})

export default function Auth() {
  // mode: login | signup-new | signup-join
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('') // school_id for joining
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError(''); setInfo('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignupNewSchool = async () => {
    if (!email || !password || !teacherName || !schoolName) {
      setError('모든 항목을 입력해주세요.'); return
    }
    setLoading(true); setError(''); setInfo('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    // 세션이 즉시 생기는 경우(이메일 확인 비활성화)에만 RPC 호출 가능
    if (data.session) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_school_and_profile', {
        p_school_name: schoolName,
        p_teacher_name: teacherName,
      })
      if (rpcError) { setError(rpcError.message); setLoading(false); return }
      const code = rpcData?.[0]?.school_code
      setInfo(`기관이 생성되었습니다!\n\n기관코드: ${code}\n\n다른 선생님이 합류할 때 이 코드를 공유하세요. (마이페이지에서 언제든 다시 확인 가능합니다)`)
    } else {
      setInfo('가입 확인 메일을 확인해주세요. 이메일 인증 후 다시 로그인하면 기관 생성이 완료됩니다.')
    }
    setLoading(false)
  }

  const handleSignupJoin = async () => {
    if (!email || !password || !teacherName || !schoolCode) {
      setError('모든 항목을 입력해주세요.'); return
    }
    setLoading(true); setError(''); setInfo('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.session) {
      const { error: rpcError } = await supabase.rpc('join_school', {
        p_school_code: schoolCode,
        p_teacher_name: teacherName,
      })
      if (rpcError) { setError(rpcError.message); setLoading(false); return }
      setInfo('가입 완료! 잠시 후 자동으로 로그인됩니다.')
    } else {
      setInfo('가입 확인 메일을 확인해주세요. 이메일 인증 후 로그인하면 기관 합류가 완료됩니다.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', background: C.surface, borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>사회·정서 발달 성장평가</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginTop: 4 }}>교사 로그인</h1>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[
            { id: 'login', label: '로그인' },
            { id: 'signup-new', label: '신규 기관 가입' },
            { id: 'signup-join', label: '기존 기관 합류' },
          ].map((t) => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(''); setInfo('') }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${mode === t.id ? C.primary : C.border}`,
                background: mode === t.id ? C.primary : C.surface,
                color: mode === t.id ? '#fff' : C.muted, cursor: 'pointer',
              }}>{t.label}</button>
          ))}
        </div>

        <input style={inputStyle} type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} />

        {mode !== 'login' && (
          <input style={inputStyle} type="text" placeholder="선생님 이름" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
        )}

        {mode === 'signup-new' && (
          <input style={inputStyle} type="text" placeholder="기관(어린이집/유치원) 이름" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        )}

        {mode === 'signup-join' && (
          <input style={inputStyle} type="text" placeholder="기관코드 (예: ABC1234)" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} />
        )}

        {error && <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{error}</p>}
        {info && <p style={{ color: C.accent, fontSize: 12, marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{info}</p>}

        <button
          onClick={mode === 'login' ? handleLogin : mode === 'signup-new' ? handleSignupNewSchool : handleSignupJoin}
          disabled={loading}
          style={btnStyle(!loading)}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
        </button>

        {mode === 'signup-new' && (
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
            가입 시 새 기관이 생성되고, 다른 선생님이 합류할 수 있는 기관코드가 발급됩니다.
          </p>
        )}
      </div>
    </div>
  )
}
