# 앱 글꼴 넣기 — py tests/font-embed.py
# sources/ 의 KERIS 학교 안심폰트(공모폰트) 원본에서 앱에 쓰는 글자만 남겨 woff2로 줄인 뒤,
# index.html 의 /* FONTS:BEGIN */ ~ /* FONTS:END */ 사이에 @font-face(base64)로 넣습니다.
# 파일 하나·인터넷 없이 돌아간다는 전제를 지키려고 외부 글꼴 파일을 따로 두지 않습니다.
#
# 라이선스: KERIS 학교 안심폰트 라이선스 안내표(2026-09-30 확인) — 문서·웹·임베딩, 파일 수정·재배포, 상업적 이용 허용,
#   출처표기 의무 없음, 파일 자체 유료 판매·배포 대가 수령 불가. 원본 파일은 공개 저장소에 올리지 않습니다(sources/).
# 필요: py -m pip install --user fonttools brotli
import base64, io, pathlib, re
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "sources"
HTML = ROOT / "index.html"

# 쓸 글꼴 — (CSS 이름, 원본, 굵기 범위)
FACES = [
    ("KERIS Baeum",  SRC / "케리스 배움체" / "KERISBAEUM_B.otf",                 "600 900"),  # 제목
    ("Hakgyoansim Bareundotum", SRC / "학교안심 바른돋움" / "HakgyoansimBareondotumR.otf", "100 550"),  # 본문
    ("Hakgyoansim Bareundotum", SRC / "학교안심 바른돋움" / "HakgyoansimBareondotumB.otf", "551 900"),  # 본문 굵게
]

html = HTML.read_text(encoding="utf-8")
# 남길 글자: 앱에 들어 있는 모든 글자 + KS X 1001 한글 2,350자(입력란에 치는 글자) + 영문·숫자·기호
chars = set(html)
chars |= {bytes([hi, lo]).decode("euc-kr") for hi in range(0xB0, 0xC9) for lo in range(0xA1, 0xFF)}
chars |= {chr(c) for c in range(0x20, 0x7F)}
chars |= set("·‘’“”…→←↺①②③④⑤○△×Ｘ「」『』〈〉《》·")
text = "".join(sorted(c for c in chars if c.isprintable()))

def woff2(path):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]           # 이름·저작권 표기는 남깁니다
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    font = TTFont(path)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return buf.getvalue()

css = []
for fam, path, weight in FACES:
    data = woff2(path)
    print(f"{path.name}: {path.stat().st_size//1024} KB → woff2 {len(data)//1024} KB")
    css.append("@font-face{font-family:\"%s\";font-weight:%s;font-style:normal;font-display:swap;"
               "src:url(data:font/woff2;base64,%s) format(\"woff2\")}" % (fam, weight, base64.b64encode(data).decode()))

B, E = "/* FONTS:BEGIN */", "/* FONTS:END */"
a, b = html.find(B), html.find(E)
if a < 0 or b < 0:
    raise SystemExit("index.html 에 FONTS 표지가 없습니다")
html = html[:a + len(B)] + "\n" + "\n".join(css) + "\n" + html[b:]
HTML.write_text(html, encoding="utf-8", newline="")
print("index.html", len(html.encode("utf-8")) // 1024, "KB, 글자", len(text))
