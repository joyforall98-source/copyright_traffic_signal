// 추가 문제 검토·앱에 넣기 — node tests/quiz-embed.mjs [--approve 3,5,8] [--reject 4] [--approve-agree]
//   아무 옵션 없이 돌리면: ground/퀴즈검토.md(검토표)를 다시 쓰고, 승인된 문제만 index.html의 QUIZ_EXTRA에 넣습니다.
//   --approve 번호들   그 문제를 오늘 날짜로 승인
//   --reject  번호들   그 문제를 버림(은행에는 남기되 앱에 넣지 않음)
//   --approve-agree    1단계 규칙과 판정이 맞는 검토 대기 문제를 한꺼번에 승인(규칙과 다르거나 비교 불가인 것은 건드리지 않음)
// 키도 네트워크도 쓰지 않습니다.
import fs from "node:fs";
const bankPath=new URL("../quiz/bank.json",import.meta.url);
if(!fs.existsSync(bankPath)){ console.error("quiz/bank.json이 없습니다. 먼저 node tests/quiz-gen.mjs 로 문제를 만드십시오."); process.exit(2); }
const bank=JSON.parse(fs.readFileSync(bankPath,"utf8").replace(/^﻿/,""));   /* 메모장 저장 시 붙는 BOM 제거 */
const today=new Date().toISOString().slice(0,10);
const arg=k=>{const i=process.argv.indexOf(k); return i<0?[]:String(process.argv[i+1]||"").split(",").map(Number).filter(Boolean);};
const has=k=>process.argv.includes(k);
for(const x of bank){
  if(arg("--approve").includes(x.id)){ x.ok=today; delete x.no; }
  if(arg("--reject").includes(x.id)){ x.no=today; x.ok=""; }
  if(has("--approve-agree")&&!x.ok&&!x.no&&x.agree===true) x.ok=today;
}
fs.writeFileSync(bankPath,JSON.stringify(bank,null,1)+"\n");

/* 검토표 */
const A=["문제가 됩니다(Ｘ)","써도 됩니다(○)","따져봐야 합니다(△)"], R={go:"통과",hold:"조건부",stop:"위험",unk:"판단 보류"};
const pend=bank.filter(x=>!x.ok&&!x.no), ok=bank.filter(x=>x.ok), no=bank.filter(x=>x.no);
const row=x=>`### ${x.id}. ${x.c} (${x.t})${x.agree===false?"  ⚠ 규칙과 다름":x.agree===null?"  · 규칙 없음":""}

- 문제: ${x.q}
- 정답: **${A[x.a]}** · 1단계 규칙: ${R[x.rule]||x.rule}
- 풀이: ${x.why}
`;
fs.writeFileSync(new URL("../ground/퀴즈검토.md",import.meta.url),`# 추가 문제 검토표

\`node tests/quiz-embed.mjs\`로 quiz/bank.json에서 뽑았습니다. 문제는 제작자 PC에서 Upstage로 만든 초안입니다.
승인: \`node tests/quiz-embed.mjs --approve 번호,번호\` · 버림: \`--reject 번호\` · 규칙과 맞는 것 한꺼번에: \`--approve-agree\`

- 은행 ${bank.length}개 · 승인(앱에 들어감) ${ok.length}개 · 검토 대기 ${pend.length}개 · 버림 ${no.length}개
- ‘규칙과 다름’: 1단계 규칙 판정과 정답이 어긋남. 문제 문장이 애매하거나 정답이 틀렸을 수 있으니 먼저 보십시오.

## 검토 대기

${pend.sort((a,b)=>(a.agree===false?0:1)-(b.agree===false?0:1)||a.id-b.id).map(row).join("\n")||"(없음)"}
`);

/* 앱에 넣기 — 승인된 것만, 앱에 필요한 칸만 */
const p=new URL("../index.html",import.meta.url);
let h=fs.readFileSync(p,"utf8");
const B="/* QUIZ_EXTRA:BEGIN */", E="/* QUIZ_EXTRA:END */";
const a=h.indexOf(B), b=h.indexOf(E);
if(a<0||b<0){ console.error("index.html에 QUIZ_EXTRA 표지가 없습니다."); process.exit(2); }
const items=ok.map(x=>({t:x.t,c:x.c,a:x.a,q:x.q,why:x.why}));
const code="\nconst QUIZ_EXTRA=["+(items.length?"\n"+items.map(x=>" "+JSON.stringify(x)).join(",\n")+"\n":"")+"];\n";
h=h.slice(0,a+B.length)+code+h.slice(b);
fs.writeFileSync(p,h);
console.log(`앱에 넣음 ${items.length}개 · 검토 대기 ${pend.length}개 · 버림 ${no.length}개 → ground/퀴즈검토.md`);
