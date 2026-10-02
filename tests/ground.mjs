// 근거 문서 사본 생성 — node tests/ground.mjs
// index.html의 groundingDoc() 출력을 ground/근거문서.md 로 그대로 옮깁니다. 조문·시행령·폰트 목록을 고친 뒤 실행하십시오.
import fs from "node:fs"; import vm from "node:vm";
const h=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const grab=(start,end)=>{const a=h.indexOf(start);const b=h.indexOf(end,a);
  if(a<0||b<0){console.error("구간 표지를 찾지 못했습니다: "+start);process.exit(2);} return h.slice(a,b);};
const src=grab("const LAWCHECK=","/* 제136조")
  +grab("const GUIDEDB=","\n};")+"\n};\n"
  +grab("const CASEDB=","\n};")+"\n};\n"
  +grab("const FONT_CHECK=","\n")+"\n"
  +grab("const FONT_SAFE=","\n};")+"\n};\n"
  +grab("function caseDoc(){","\n/* 2단계 에이전트 경로");
const ctx={}; vm.createContext(ctx);
vm.runInContext(src+"\nthis.doc=groundingDoc();this.lc=LAWCHECK;this.fc=FONT_CHECK;",ctx);
const {doc,lc,fc}=ctx;
const out=`# 근거 문서 사본

index.html의 \`groundingDoc()\` 출력을 그대로 옮긴 것입니다. 2단계 AI에 붙는 [근거 문서]와 같습니다.
손으로 고치지 말고, 앱을 고친 뒤 \`node tests/ground.mjs\`로 다시 뽑으십시오.

- 조문: ${lc.by} 대조 ${lc.on} · 저작권법(${lc.law}) · 저작권법 시행령(${lc.decree})
- 폰트: ${fc.by} 대조 ${fc.on}

---

\`\`\`text
${doc}
\`\`\`
`;
fs.writeFileSync(new URL("../ground/근거문서.md",import.meta.url),out);
console.log("ground/근거문서.md", doc.length+"자");
