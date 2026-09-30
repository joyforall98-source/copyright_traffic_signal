// 1단계 규칙 회귀 검사 — node tests/run.mjs
// index.html에서 규칙 부분(LAWCHECK ~ NAME 앞)만 떼어 실행합니다. 브라우저·네트워크 불필요.
// 종료 코드: 오판정(관대·과잉)이나 함께 걸린 조건 불일치가 1건이라도 있으면 1.
import fs from "node:fs"; import vm from "node:vm";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const a=html.indexOf("const LAWCHECK="), b=html.indexOf("const NAME=");
if(a<0||b<0){console.error("규칙 구간 표지(LAWCHECK/NAME)를 찾지 못했습니다.");process.exit(2);}
const ctx={}; vm.createContext(ctx); vm.runInContext(html.slice(a,b)+"\nthis.rules=rules;this.signals=signals;",ctx);
const cases=JSON.parse(fs.readFileSync(new URL("./cases.json",import.meta.url),"utf8"));
const rank={go:0,hold:1,stop:2}, NAME={go:"통과",hold:"조건부",stop:"위험",unk:"판단 보류"};
const tally={정답:0,보류:0,"관대 오판":0,"과잉 판정":0}; const bad=[]; let sigBad=0;
for(const c of cases){
  /* scope 칸이 있으면 화면의 공개 범위 단추를 누른 것과 같게 판정합니다(되묻기 뒤 재판정). */
  vm.runInContext("scopeChoice="+JSON.stringify(c.scope||"auto"),ctx);
  const r=ctx.rules(c.q), got=r.v;
  const k = got===c.expect?"정답" : got==="unk"?"보류" : c.expect==="unk"?"과잉 판정"
          : rank[got]<rank[c.expect]?"관대 오판":"과잉 판정";
  tally[k]++; if(k!=="정답") bad.push(`${String(c.id).padStart(2)} [${k}] 기대 ${NAME[c.expect]} → ${NAME[got]} | ${c.q}`);
  /* signals 칸이 있으면 함께 걸린 조건의 종류가 정확히 같은지 봅니다(순서 무관). */
  if(c.signals){
    const g=ctx.signals(c.q,r).map(x=>x.fam).sort().join(","), e=[...c.signals].sort().join(",");
    if(g!==e){ sigBad++; bad.push(`${String(c.id).padStart(2)} [조건 불일치] 기대 [${e}] → [${g}] | ${c.q}`); }
  }
}
console.log(tally, sigBad?{"조건 불일치":sigBad}:""); bad.forEach(l=>console.log(l));
process.exit(tally["관대 오판"]+tally["과잉 판정"]+sigBad>0?1:0);
