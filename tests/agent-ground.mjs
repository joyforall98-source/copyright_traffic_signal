// 에이전트 근거 자료 생성 — node tests/agent-ground.mjs
// Laivstudio 에이전트(02_답·03_검토)의 [근거 자료] 칸에 붙일 내용을 앱에서 뽑아 ground/에이전트근거.md 로 씁니다.
// 앱과 에이전트가 같은 근거로 같은 말을 하게 하려는 것입니다. 손으로 고치지 말고 앱을 고친 뒤 다시 뽑으십시오.
import fs from "node:fs"; import vm from "node:vm";
const h=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const grab=(start,end)=>{const a=h.indexOf(start);const b=h.indexOf(end,a);
  if(a<0||b<0){console.error("구간 표지를 찾지 못했습니다: "+start);process.exit(2);} return h.slice(a,b);};
const ctx={}; vm.createContext(ctx);
vm.runInContext(grab("const LAWCHECK=","const NAME=")
  +grab("const FONT_CHECK=","\n")+"\n"+grab("const FONT_SAFE=","\n};")+"\n};\n"
  +grab("function caseDoc(){","\n/* 2단계 에이전트 경로")
  +"\nthis.rules=rules;this.lawLine=lawLine;this.doc=groundingDoc();",ctx);

const sys=grab("const SYS=`","`;");
const scope=sys.slice(sys.indexOf("[답변하지 않는 것]"),sys.indexOf("[답변 형식]")).trim();

const NAME={go:"통과",hold:"조건부",stop:"위험",unk:"판단 보류"};
const SC={in:"교실 안",out:"교실 밖","?":"미상"};
const strip=x=>x.replace(/<br>/g," / ").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
const alt=a=>(a||[]).map(x=>x.includes("|")?x.split("|")[0]+" ("+x.split("|")[1]+")":x).join(" / ");

const cases=JSON.parse(fs.readFileSync(new URL("./cases.json",import.meta.url),"utf8"));
const seen=new Set(), ex=[];
for(const c of cases){
  vm.runInContext("scopeChoice="+JSON.stringify(c.scope||"auto"),ctx);   /* 되묻기 뒤 사례는 고른 범위로 */
  const r=ctx.rules(c.q); const key=r.h+"|"+r.v+(c.agent?"|"+c.id:"");   /* agent:true 사례는 같은 판정 문구라도 따로 싣습니다 */
  if(seen.has(key)) continue; seen.add(key);
  ex.push(`입력: ${c.q}`+(c.scope?` (되묻기에서 고른 범위: ${c.scope==="out"?"밖에 공개(학부모가 있거나 공개된 방)":"교실 안에서만"})`:"")+`\n공개 범위: ${SC[r.sc]||r.sc}\n판정: ${NAME[r.v]}\n이유: ${r.l}\n근거: ${strip(ctx.lawLine(r.law))}`+(r.a?`\n대안: ${alt(r.a)}`:""));
}

const body=`## 이 자료의 범위

이 자료는 「수업자료 저작권 신호등」 앱(index.html)에서 자동으로 뽑은 것입니다. 앱과 같은 근거로 같은 판정을 하십시오.
앱이 답하지 않는 것은 에이전트도 답하지 않습니다.

${scope}

## 근거 문서

${ctx.doc}

## 판정 사례 (1단계 규칙이 내리는 판정 — 같은 사안은 같은 판정·같은 근거로 답하십시오)

공개 범위가 판정을 가릅니다. 수업 안(교실·수업 시간·반 전용 LMS)에서 쓰는 것과, 누구나 볼 수 있는 곳에 올리는 것은 다르게 판정합니다.
공개 범위가 미상이면 어디에 쓸 것인지 먼저 되묻습니다.
학급 밴드·단톡방은 학생과 교사만 있는 비공개 방이면 수업 안(저작권 경고 문구·출처 표시, 필요한 일부분만), 학부모가 함께 있거나 누구나 들어올 수 있으면 밖입니다. 어느 쪽인지 모르면 되묻습니다.

${ex.map((e,i)=>`**사례 ${i+1}**\n${e}`).join("\n\n")}
`;

const out=`# 에이전트 근거 자료

Laivstudio 에이전트(02_답·03_검토)의 [근거 자료] 칸에 붙이는 내용입니다. \`node tests/agent-ground.mjs\`로 앱에서 뽑았습니다.
아래 선 사이의 내용 전체를 두 프롬프트의 [근거 자료] 자리에 그대로 붙여 넣습니다.

<!-- BEGIN -->
${body}<!-- END -->
`;
fs.writeFileSync(new URL("../ground/에이전트근거.md",import.meta.url),out);
console.log("ground/에이전트근거.md", body.length+"자, 판정 사례 "+ex.length+"건");
if(/제136조|벌칙|[0-9][0-9,]{5,}원/.test(body)){console.error("벌칙·금액이 들어 있습니다. 확인하십시오.");process.exit(1);}
