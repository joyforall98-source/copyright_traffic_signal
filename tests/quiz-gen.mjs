// 학생 퀴즈 추가 문제 만들기 — node tests/quiz-gen.mjs [개수=20]
// 제작자 PC에서만 돌립니다. Upstage 키는 저장소 밖 .env 파일에만 둡니다(CLAUDE.md 규칙 8).
//   .env 예시:  UPSTAGE_API_KEY=up-...     (선택) UPSTAGE_MODEL=solar-pro4
// 만든 문제는 quiz/bank.json 에 '미승인'으로 쌓입니다. 앱에는 들어가지 않습니다.
// 선생님이 검토·승인한 뒤 node tests/quiz-embed.mjs 로 앱에 넣습니다.
import fs from "node:fs"; import vm from "node:vm";

/* .env 읽기 — 의존 패키지 없이 KEY=VALUE 줄만 읽습니다. 키 값은 화면에 찍지 않습니다. */
const envPath=new URL("../.env",import.meta.url);
const env=Object.fromEntries((fs.existsSync(envPath)?fs.readFileSync(envPath,"utf8"):"")
  .split(/\r?\n/).map(l=>l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map(m=>[m[1],m[2].replace(/^["']|["']$/g,"")]));
const KEY=process.env.UPSTAGE_API_KEY||env.UPSTAGE_API_KEY;
const MODEL=process.env.UPSTAGE_MODEL||env.UPSTAGE_MODEL||"solar-pro4";
if(!KEY){ console.error("UPSTAGE_API_KEY가 없습니다. 저장소 폴더의 .env 파일에 UPSTAGE_API_KEY=up-... 한 줄을 넣으십시오."); process.exit(2); }

/* 앱에서 규칙·근거 문서·기본 문제를 꺼냅니다. 앱과 같은 기준으로 문제를 만들고 검사하기 위해서입니다. */
const h=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const grab=(s,e)=>{const a=h.indexOf(s), b=h.indexOf(e,a); if(a<0||b<0){console.error("구간 표지 없음: "+s);process.exit(2);} return h.slice(a,b);};
const ctx={}; vm.createContext(ctx);
vm.runInContext(grab("const LAWCHECK=","const NAME=")
  +grab("const FONT_CHECK=","\n")+"\n"+grab("const FONT_SAFE=","\n};")+"\n};\n"
  +grab("function caseDoc(){","\n/* 2단계 에이전트 경로")
  +grab("const QUIZ_BANK=","\nlet QUIZ=")
  +"\nthis.rules=rules;this.doc=groundingDoc();this.base=QUIZ_BANK;",ctx);

const bankPath=new URL("../quiz/bank.json",import.meta.url);
const bank=fs.existsSync(bankPath)?JSON.parse(fs.readFileSync(bankPath,"utf8").replace(/^﻿/,"")):[];

/* 판정 기준은 앱의 기본 퀴즈·1단계 규칙과 같게 못 박습니다. 다르면 학생이 두 기준을 배웁니다. */
const QUIZ_SYS=`당신은 한국 초등학교 5~6학년 실과 수업에 쓸 저작권 퀴즈를 만듭니다.
2022 개정 교육과정 성취기준과 아래 학습목표에 맞춥니다.
  t1 사이버 공간에서 정보 윤리를 알고 실천할 수 있다
  t2 디지털 콘텐츠의 개념과 종류를 설명할 수 있다
  t3 디지털 콘텐츠 저작 도구를 사용하여 발표 자료를 만들 수 있다

판정 기준은 반드시 아래를 따릅니다. 이 기준을 벗어나지 마십시오.
  a=1 (써도 됩니다(○))   직접 만든 것, 공유마당·공공누리·학교 안심폰트처럼
                         이용 조건이 공개된 자료, 교실 안에서만 쓰고 끝나는 경우
  a=0 (문제가 됩니다(Ｘ)) 보호되는 캐릭터·교과서·상용 음원을 교실 밖(유튜브·SNS·
                         가정통신문 등)으로 내보내는 경우, 남의 것을
                         자기 것처럼 제출하는 경우, 폰트 파일을 나눠 주는 경우
  a=2 (따져봐야 합니다(△)) 생성형 AI 산출물, 사람이 찍힌 사진, 이용 조건이
                         불분명한 무료 폰트처럼 근거가 부족한 경우
  학급 밴드·단톡방: 선생님과 우리 반 친구들만 있는 비공개 방이면 교실 안,
                   부모님이 함께 있거나 누구나 들어올 수 있으면 교실 밖입니다.
                   누가 있는지 문제 문장에 반드시 적으십시오.

선택지는 늘 세 개(○·Ｘ·△)가 함께 나갑니다. 그래서 △를 쉽게 쓰면 학생이 "애매하면 △"만 배웁니다.
- 정답이 ○나 Ｘ로 분명한 장면을 △로 만들지 마십시오. △는 위 a=2의 세 경우에만 씁니다.
- 한 번에 만드는 문제 중 △는 다섯에 하나를 넘지 않게 하고, ○와 Ｘ는 비슷한 수로 만드십시오.
- △ 문제의 why에는 "무엇을 확인하면 ○나 Ｘ로 정해지는지"를 적으십시오.
- 문제 문장에 "애매", "경우에 따라"처럼 정답을 흘리는 말을 쓰지 마십시오.

규칙
- 초등학생이 실제로 겪는 장면으로 씁니다. 법률 용어를 쓰지 마십시오.
- 조문 번호, 법 이름, 판례 사건번호를 절대 쓰지 마십시오.
- 겁을 주지 마십시오. 벌금이나 처벌, 금액을 언급하지 마십시오.
- 아래 [근거 문서]와 어긋나는 설명을 하지 마십시오. 근거 문서에 없는 사실을 지어내지 마십시오.
- q 는 한두 문장, why 는 두 문장 이내로 왜 그런지 설명합니다.
- 장면이 겹치지 않게 다양한 소재(사진·글·음악·영상·글씨체·AI·발표 자료)를 고르게 씁니다.

아래 JSON 객체만 출력하십시오. 설명, 머리말, 코드블록 표시를 붙이지 마십시오.
{"items":[{"t":"t1","c":"분야이름(12자 이내)","a":0,"q":"문제 문장","why":"설명"}]}`;

/* 칸 배정 — 2026-09-30 첫 실행에서 모델이 '겹치지 말라'고 준 기존 문제를 베끼거나 바꿔 쓰기만 했습니다(75개 중 54개 중복).
   그래서 칸마다 정답과 소재를 정해 주고, 기존 문제는 앱 기본 문제만 '쓰면 안 되는 장면'으로 보여 줍니다.
   정답 무늬 ○·Ｘ·Ｘ·○·△ — △는 다섯에 하나. 소재는 정답에 맞는 것만 짝짓습니다. */
const SLOT_TOPIC={
  1:["직접 찍은 사진·직접 그린 그림","직접 만든 노래나 영상","공유마당·공공누리 자료","학교 안심폰트","수업 시간에 교실에서만 음악·영상 감상",
     "선생님과 우리 반만 있는 비공개 학습방","출처를 밝히고 짧게 인용한 글"],
  0:["만화 캐릭터 그림을 누구나 보는 곳에 공개","가요·음원을 넣은 영상을 공개","교과서·책을 찍어 누구나 보는 곳에 올리기","글씨체 파일을 친구에게 나눠 주기",
     "남의 글·그림을 내 것처럼 제출","부모님도 함께 있는 단톡방·밴드에 남의 저작물 올리기","영화 장면을 잘라 유튜브에 올리기"],
  2:["생성형 AI로 만든 그림·글","친구 얼굴이 찍힌 사진","이용 조건이 적혀 있지 않은 무료 글씨체"]};
const PATTERN=[1,0,0,1,2];
let slotNo=Math.floor(Math.random()*35);
const nextSlots=n=>Array.from({length:n},()=>{const k=slotNo++, a=PATTERN[k%5], L=SLOT_TOPIC[a]; return {a,topic:L[(k*3+Math.floor(k/5))%L.length]};});

async function ask(slots){
  const body={model:MODEL,temperature:0.7,max_tokens:4000,response_format:{type:"json_object"},
    messages:[{role:"system",content:QUIZ_SYS+"\n\n[근거 문서]\n"+ctx.doc},
              {role:"user",content:"아래 칸마다 문제를 하나씩, 칸 순서대로 만드십시오. 칸에 적힌 정답(a)과 소재를 반드시 지키십시오.\n"
                +slots.map((s,i)=>`${i+1}. a=${s.a}, 소재: ${s.topic}`).join("\n")
                +"\n\n장면은 발표 자료만 쓰지 말고 학급 신문·학예회·과제·동아리·집·방과후처럼 여러 곳으로 고르게 하십시오."
                +"\n아래는 앱에 이미 있는 문제입니다. 같은 장면을 쓰거나 문장만 바꿔 쓰면 버려집니다.\n- "+ctx.base.map(x=>x.q).join("\n- ")}]};
  /* 한도: 분당 요청 100·토큰 25만(2026-09-30 응답 헤더). Laivstudio 에이전트도 같은 키를 쓰므로
     에이전트를 시험하는 중에 돌리면 429가 납니다. 429면 헤더의 초기화 시각까지 기다렸다가 세 번까지 다시 보냅니다. */
  let r;
  for(let tries=0;;tries++){
    r=await fetch("https://api.upstage.ai/v1/chat/completions",{method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+KEY},body:JSON.stringify(body)});
    if(r.status!==429||tries>=3) break;
    const reset=Math.max(Number(r.headers.get("x-upstage-ratelimit-reset-tokens"))||0,Number(r.headers.get("x-upstage-ratelimit-reset-requests"))||0);
    const wait=Math.min(90,Math.max(10,reset?reset-Date.now()/1000+2:30));
    console.error(`한도 초과(429) — ${Math.round(wait)}초 기다렸다가 다시 보냅니다`);
    await new Promise(res=>setTimeout(res,wait*1000));
  }
  if(!r.ok){ const t=await r.text(); throw new Error("HTTP "+r.status+" "+t.slice(0,300)); }
  const d=await r.json(); const raw=(d.choices?.[0]?.message?.content)||"";
  const j=JSON.parse(raw.slice(raw.indexOf("{"),raw.lastIndexOf("}")+1));
  return Array.isArray(j.items)?j.items:[];
}

/* 기계 검사 — 걸리면 버립니다. 판정이 1단계 규칙과 다르면 버리지 않고 '규칙과 다름'으로 표시해 검토에 올립니다.
   퀴즈는 세 갈래라 1단계의 '조건부'는 '써도 됩니다(○)'(조건 안에서)와 '따져봐야 합니다(△)' 둘 다와 맞는 것으로 봅니다.
   1단계가 판단 보류(unk)면 비교할 기준이 없으므로 agree=null(규칙 없음)로 둡니다. */
const BAN=/제\s*\d+\s*조|저작권법|판례|대법원|벌금|벌칙|처벌|징역|형사|고소|\d[\d,]*\s*(만\s*)?원/;
const ruleToA={go:[1],stop:[0],hold:[1,2]};
const norm=s=>String(s).replace(/\s+/g,"");
/* 거의 같은 문장 — 글자 두 개씩 묶은 조각이 절반 넘게 겹치면 바꿔 쓴 것으로 봅니다 */
const bi=s=>{s=norm(s).replace(/[^\p{L}\p{N}]/gu,"");const g=new Set();for(let i=0;i<s.length-1;i++)g.add(s.slice(i,i+2));return g;};
const sim=(A,B)=>{let c=0;for(const x of A)if(B.has(x))c++;return c/Math.max(1,Math.min(A.size,B.size));};
const n=Number(process.argv[2]||20), BATCH=8;
const seen=[...ctx.base.map(x=>x.q),...bank.map(x=>x.q)];
const seenN=new Set(seen.map(norm)), seenB=seen.map(bi);
const today=new Date().toISOString().slice(0,10);
const reasons={};
let calls=0, made=0, dropped=0, nextId=bank.reduce((m,x)=>Math.max(m,x.id||0),0)+1;

while(made<n){
  const want=Math.min(BATCH,n-made);
  let items; const slots=nextSlots(want);
  try{ items=await ask(slots); }catch(e){ console.error("생성 실패: "+e.message); break; }
  if(!items.length){ console.error("빈 응답"); break; }
  if(++calls>Math.ceil(n/BATCH)*4){ console.error("버리는 문제가 너무 많아 멈춥니다"); break; }
  for(const [i,x] of items.entries()){
    if(x&&typeof x.a==="string"&&/^[012]$/.test(x.a)) x.a=Number(x.a);
    const why = !x||typeof x.q!=="string"||typeof x.why!=="string" ? "형식"
      : ![0,1,2].includes(x.a) ? "정답 값"
      : slots[i]&&x.a!==slots[i].a ? "칸의 정답과 다름"
      : x.q.length<10||x.q.length>160||x.why.length>220 ? "길이"
      : BAN.test(x.q+x.why) ? "금지어("+(x.q+x.why).match(BAN)[0]+")"
      : /애매|경우에 따라|괜찮습니다|문제가 됩니다|(써|해|불러|올려|보여 ?줘)도 됩니다|안 됩니다\.?\s*$/.test(x.q) ? "정답 흘림"
      : /안심(폰트)?.{0,4}이름|이름.{0,8}안심/.test(x.why) ? "틀린 설명(이름만 보고 안심)"
      : /몇 ?가지|무엇일까|어느 것|고르/.test(x.q) ? "문제 형식"
      : seenN.has(norm(x.q)) ? "중복"
      : seenB.some(g=>sim(bi(x.q),g)>0.5) ? "비슷함" : "";
    if(why){ dropped++; reasons[why]=(reasons[why]||0)+1; continue; }
    vm.runInContext('scopeChoice="auto"',ctx);
    const rv=ctx.rules(x.q).v;
    bank.push({id:nextId++, t:["t1","t2","t3"].includes(x.t)?x.t:"t1", c:String(x.c||"추가 문제").slice(0,12),
      a:x.a, q:x.q.trim(), why:x.why.trim(), rule:rv, agree:rv==="unk"?null:ruleToA[rv].includes(x.a),
      model:MODEL, made:today, ok:""});
    seen.push(x.q); seenN.add(norm(x.q)); seenB.push(bi(x.q)); made++;
    if(made>=n) break;
  }
}
if(made){
  fs.mkdirSync(new URL("../quiz/",import.meta.url),{recursive:true});
  fs.writeFileSync(bankPath,JSON.stringify(bank,null,1)+"\n");
}
const pend=bank.filter(x=>!x.ok&&!x.no);
console.log(`새로 ${made}개 (버림 ${dropped}) · 문제 은행 ${bank.length}개 · 검토 대기 ${pend.length}개 (그중 규칙과 다름 ${pend.filter(x=>x.agree===false).length})`);
if(dropped) console.log("버린 이유", reasons);
const cnt=a=>bank.filter(x=>!x.no&&x.a===a).length;
console.log(`정답 분포(버림 제외) ○ ${cnt(1)} · Ｘ ${cnt(0)} · △ ${cnt(2)}`);
console.log("다음: node tests/quiz-embed.mjs 로 검토표를 만들고, 승인한 뒤 다시 돌려 앱에 넣습니다.");
