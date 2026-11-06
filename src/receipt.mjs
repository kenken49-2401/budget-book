// Conservative extraction: never use tax, change, or subtotal as the final total.
const categories = [
  ['日用品', /ティッシュ|トイレット|洗剤|石けん|せっけん|シャンプー|歯ブラシ|歯磨|ラップ|ごみ袋|ゴミ袋|マスク|電池|キッチンペーパー/],
  ['医療', /医薬品|風邪薬|頭痛薬|絆創膏|ばんそうこう/],
  ['食費', /牛乳|ヨーグルト|チーズ|パン|卵|たまご|玉子|肉|豚|鶏|牛|魚|鮭|刺身|米|ご飯|弁当|おにぎり|野菜|キャベツ|トマト|豆腐|納豆|麺|うどん|そば|水|茶|コーヒー|ジュース|ビール|菓子|チョコ|りんご|バナナ|アイス|砂糖|塩|醤油|しょうゆ|油|食品/],
];
const ignore = /合計|小計|税込|税抜|消費税|内税|外税|対象|お預|預り|お釣|おつり|釣銭|現金|クレジット|カード|電子マネー|ポイント|領収|電話|TEL|電話番号|レジ|担当|お買上|お買い上げ|返品|値引|割引|税率|登録番号|取引|枚数|商品数|点数|会員|お支払|支払|釣り|預り|残高|軽減税率|ありがとうございました/i;
const amountAtEnd = /(?:[¥￥] ?)?([0-9][0-9,]*)\s*円?\s*[*※]?\s*$/;
function amount(s) { const n=Number(s.replaceAll(',','')); return Number.isSafeInteger(n)&&n>0&&n<=10000000?n:null; }
export function parseReceipt(text) {
  const lines=String(text).normalize('NFKC').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let total=null;
  for(let i=0;i<lines.length;i++){
    const line=lines[i]; if(!/(?:合計|ご請求|請求金額|支払金額)/.test(line)||/小計|対象|税額|内税|外税|割引|値引/.test(line)) continue;
    const match=line.match(amountAtEnd); const next=lines[i+1]?.match(/^\s*[¥￥]?\s*([\d,]+)\s*円?\s*$/); const n=amount(match?.[1]||next?.[1]||''); if(n)total=n;
  }
  const items=[];
  for(const line of lines){
    if(ignore.test(line)||/^\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2}/.test(line))continue;
    const match=line.match(amountAtEnd); if(!match||!amount(match[1]))continue;
    const name=line.slice(0,match.index).replace(/[¥￥\s*※]+$/g,'').replace(/^\d{1,3}\s+/, '').trim();
    if(name.length<2||!/[ぁ-んァ-ヶ一-龯A-Za-z]/.test(name)||name.length>50)continue;
    items.push({name,category:categories.find(([,pattern])=>pattern.test(name))?.[0]||null});
  }
  const known=items.filter(x=>x.category); const category=known.length && known.every(x=>x.category===known[0].category) && known.length===items.length?known[0].category:null;
  return {total,items:items.slice(0,30),category};
}
