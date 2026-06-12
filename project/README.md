# 사회·정서 발달 성장평가

## 1. Supabase 설정

1. Supabase 대시보드 → **SQL Editor** → `supabase_schema.sql` 내용 전체 실행
2. **Authentication → Providers → Email** 설정 확인
   - 1000명 규모 운영이라면, **Confirm email**을 꺼두면 가입 즉시 사용 가능 (테스트/내부용일 때 추천)
   - 켜두면 가입 후 이메일 인증 → 재로그인해야 기관 생성/합류가 완료됨
3. **Project Settings → API**에서 `URL`과 `anon public key` 복사

## 2. 로컬 실행

```bash
cd project
npm install
cp .env.example .env
# .env 파일에 Supabase URL / anon key 입력
npm run dev
```

## 3. GitHub에 올리기

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

`.env`는 `.gitignore`에 포함되어 있어 올라가지 않습니다 (안전).

## 4. Netlify 배포

1. Netlify → **Add new site → Import an existing project**
2. GitHub 레포 선택
3. Build 설정:
   - Base directory: `project`
   - Build command: `npm run build`
   - Publish directory: `project/dist`
4. **Site configuration → Environment variables**에 추가:
   - `VITE_SUPABASE_URL` = Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key
5. Deploy 클릭 → 빌드 완료되면 배포된 URL 확인

이후 코드 수정 → `git push` 하면 Netlify가 자동으로 재배포합니다.

## 5. 사용 흐름 (교사)

1. 처음 가입하는 선생님: "신규 기관 가입" 탭 → 기관명/이름/이메일/비밀번호 입력
   - 가입 완료 시 **기관코드(school_id)**가 화면에 표시됨 → 같은 기관 선생님들에게 공유
2. 같은 기관 다른 선생님: "기존 기관 합류" 탭 → 기관코드 입력하여 가입
3. 로그인 후 아동 등록 → 학기별 5대 영역 평가 입력 → 포트폴리오/AI 리포트 생성

## 6. 데이터 격리

- 모든 데이터는 Supabase RLS 정책에 의해 `school_id` 기준으로 자동 격리됩니다.
- 한 기관의 교사는 다른 기관의 아동/평가/리포트를 절대 볼 수 없습니다.
