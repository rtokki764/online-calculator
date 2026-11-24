from typing import List, Literal, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Calculator API",
    description="간단한 사칙연산 및 계산 기능을 제공하는 FastAPI 백엔드",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연동 대비)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalculationRequest(BaseModel):
    num1: float = Field(..., description="첫 번째 숫자")
    num2: float = Field(..., description="두 번째 숫자")
    operator: Literal["+", "-", "*", "/", "%", "^", "add", "subtract", "multiply", "divide", "modulo", "power"] = Field(
        ..., description="연산자 (+, -, *, /, %, ^ 또는 영문 명칭)"
    )

class CalculationResult(BaseModel):
    num1: float
    num2: float
    operator: str
    result: float
    expression: str

# 최근 계산 기록 메모리 저장
history: List[CalculationResult] = []

@app.get("/")
def read_root():
    return {
        "message": "계산기 백엔드 서버가 정상 실행 중입니다.",
        "docs_url": "/docs"
    }

@app.post("/calculate", response_model=CalculationResult)
def calculate(req: CalculationRequest):
    op = req.operator.lower() if req.operator.isalpha() else req.operator
    res: float

    if op in ("+", "add"):
        res = req.num1 + req.num2
        op_symbol = "+"
    elif op in ("-", "subtract"):
        res = req.num1 - req.num2
        op_symbol = "-"
    elif op in ("*", "multiply"):
        res = req.num1 * req.num2
        op_symbol = "*"
    elif op in ("/", "divide"):
        if req.num2 == 0:
            raise HTTPException(status_code=400, detail="0으로 나눌 수 없습니다.")
        res = req.num1 / req.num2
        op_symbol = "/"
    elif op in ("%", "modulo"):
        if req.num2 == 0:
            raise HTTPException(status_code=400, detail="0으로 모듈로 연산을 할 수 없습니다.")
        res = req.num1 % req.num2
        op_symbol = "%"
    elif op in ("^", "power"):
        res = req.num1 ** req.num2
        op_symbol = "^"
    else:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 연산자입니다: {req.operator}")

    # 소수점 오차 보정 (필요한 경우 깔끔하게 표현)
    if isinstance(res, float) and res.is_integer():
        res = float(int(res))

    record = CalculationResult(
        num1=req.num1,
        num2=req.num2,
        operator=op_symbol,
        result=res,
        expression=f"{req.num1} {op_symbol} {req.num2} = {res}"
    )
    history.append(record)
    return record

@app.get("/history", response_model=List[CalculationResult])
def get_history(limit: int = 10):
    return history[-limit:]

@app.delete("/history")
def clear_history():
    history.clear()
    return {"message": "계산 기록이 초기화되었습니다."}
