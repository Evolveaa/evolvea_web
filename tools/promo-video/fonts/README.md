# Fonty

`instrument-*.ttf` je **Instrument Sans** — rovnaký font, aký používa landing
(`app/page.tsx`, `next/font/google`). Licencia **SIL Open Font License 1.1**,
teda sa smie priložiť k projektu.

Súbory sú stiahnuté z Google Fonts; presné URL sú v `urls.json`. Ak by bolo
treba stiahnuť ich znova:

```bash
node -e "const u=require('./urls.json');const{execSync}=require('child_process');
for(const [w,url] of Object.entries(u)) execSync(\`curl -sS -o instrument-\${w}.ttf \"\${url}\"\`)"
```

Renderer beží offline a fonty načítava odtiaľto, aby bol výstup opakovateľný
a nezávisel od siete.
