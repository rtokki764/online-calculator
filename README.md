# 🧮 Online Calculator

> FastAPI 기반의 백엔드와 모던 반응형 웹 프론트엔드로 구성된 온라인 계산기 애플리케이션입니다.

---

## ✨ 주요 기능

- **사칙연산 및 고급 연산**: 덧셈(`+`), 뺄셈(`-`), 곱셈(`×`), 나눗셈(`÷`), 나머지(`mod`), 거듭제곱(`xʸ`)
- **실시간 API 연동**: Python FastAPI 백엔드와 비동기 REST API 통신 (`POST /calculate`)
- **계산 기록 관리**: 최근 연산 기록 자동 저장 및 실시간 조회, 전체 기록 삭제 지원
- **키보드 단축키 지원**: 숫자 패드, 사칙연산 기호, Enter(`=`), Escape(`AC`), Backspace(`⌫`) 완벽 지원
- **예외 처리**: 0으로 나누기 등 오류 발생 시 명확한 안내 및 UI 피드백
- **자동 API 문서화**: FastAPI의 Swagger UI(`http://127.0.0.1:8000/docs`) 제공

---

## 📁 프로젝트 구조

```text
online-calculator/
├── backend/
│   ├── main.py              # FastAPI 서버 애플리케이션
│   ├── requirements.txt     # Python 의존성 패키지 목록
│   └── run.bat              # Windows용 간편 서버 실행 배치 스크립트
├── frontend/
│   ├── index.html           # 계산기 웹 UI 마크업
│   ├── style.css            # 반응형 및 다크/모던 스타일링
│   └── app.js               # 계산기 로직, 이벤트 핸들링 및 API 통신
├── .gitignore
└── README.md
```

---

## 🚀 빠른 시작 (설치 및 실행 방법)

### 1. 사전 요구사항
- **Python**: 3.9 이상
- **웹 브라우저**: 최신 Chrome, Edge, Firefox, Safari 등

---

### 2. 백엔드 (FastAPI) 설정 및 실행

#### Windows (간편 실행)
`backend/run.bat` 파일을 더블클릭하거나 터미널에서 실행하면 가상환경 활성화 및 서버가 바로 실행됩니다.
```cmd
cd backend
run.bat
```

#### 수동 실행 (Windows / macOS / Linux)

1. **저장소 클론**:
   ```bash
   git clone https://github.com/rtokki764/online-calculator.git
   cd online-calculator/backend
   ```

2. **가상환경 생성 및 활성화**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **필요 라이브러리 설치**:
   ```bash
   pip install -r requirements.txt
   ```

4. **FastAPI 서버 실행**:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

   - 서버가 정상 구동되면 아래 주소로 접속할 수 있습니다:
     - API 서버 루트: `http://127.0.0.1:8000/`
     - 대화형 Swagger 문서: `http://127.0.0.1:8000/docs`

---

### 3. 프론트엔드 실행

별도의 빌드 과정 없이 정적 파일로 동작합니다.

1. **브라우저에서 직접 열기**:
   - `frontend/index.html` 파일을 더블클릭하여 웹 브라우저에서 엽니다.
2. **또는 로컬 웹 서버로 열기 (권장)**:
   - Python 내장 HTTP 서버 활용:
     ```bash
     cd frontend
     python -m http.server 3000
     ```
   - 브라우저에서 `http://localhost:3000` 접속

> [!NOTE]
> 백엔드 서버가 `http://127.0.0.1:8000`에서 실행 중이면 상단 상태 표시등이 초록색("연결됨")으로 표시됩니다.
> 다른 주소나 포트에서 백엔드가 실행 중인 경우 쿼리 파라미터(`index.html?api=http://localhost:포트`)로 연결 주소를 변경할 수 있습니다.

---

## 📡 API 명세

| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `GET` | `/` | 서버 헬스 체크 및 안내 메시지 |
| `POST` | `/calculate` | 연산 수행 (`num1`, `num2`, `operator`) |
| `GET` | `/history` | 최근 계산 기록 목록 조회 (`limit` 지정 가능) |
| `DELETE` | `/history` | 저장된 계산 기록 초기화 |

### 계산 요청 예시 (`POST /calculate`)
```json
{
  "num1": 12.5,
  "num2": 4,
  "operator": "*"
}
```

### 계산 응답 예시
```json
{
  "num1": 12.5,
  "num2": 4.0,
  "operator": "*",
  "result": 50.0,
  "expression": "12.5 * 4.0 = 50.0"
}
```

---

## 📄 라이선스
MIT License
