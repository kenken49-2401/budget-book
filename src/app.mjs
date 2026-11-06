import { validateEntry, monthlySummary } from './ledger.mjs';
const $ = id => document.getElementById(id);
const key = 'budget-book-prototype-v1';
const form = $('form');
let entries = [], editing = null, current = new Date();
current.setDate(1);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const monthKey = () => `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
const yen = n => `${n < 0 ? '−' : ''}¥${Math.abs(n).toLocaleString('ja-JP')}`;
function validateRecord(raw) {
  const e = validateEntry(raw);
  if (typeof e.id !== 'string' || !e.id || typeof e.memo !== 'string' || e.memo.length > 100 || e.category.length > 40) throw Error('記録の形式が正しくありません');
  if (e.receipt != null && (typeof e.receipt !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(e.receipt) || e.receipt.length > 3_000_000)) throw Error('写真の形式またはサイズが正しくありません');
  return e;
}
function save(next) { localStorage.setItem(key, JSON.stringify(next)); entries = next; }
try { const raw = localStorage.getItem(key); if (raw) { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) throw Error(); entries = parsed.map(validateRecord); } } catch { alert('保存データを読み込めませんでした。データの上書きを防ぐため操作を停止します。'); throw Error('Invalid saved data'); }
function el(tag, text, cls) { const node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; }
function render() {
  const month = monthKey(), rows = entries.filter(e => e.date.startsWith(month+'-')).sort((a,b) => b.date.localeCompare(a.date));
  $('month').textContent = `${current.getFullYear()}年 ${current.getMonth()+1}月`;
  const s = monthlySummary(entries, month); $('income').textContent = yen(s.income); $('expense').textContent = yen(s.expense); $('balance').textContent = yen(s.balance); $('count').textContent = `${rows.length}件`;
  const list = $('list'); list.replaceChildren();
  if (!rows.length) list.append(el('div','この月の記録はありません。\n「＋ 記録する」から始めましょう。','empty'));
  for (const e of rows) {
    const row=el('div',null,'row'), info=el('div',null,'row-main'); info.append(el('strong', e.memo || e.category),el('small',`${e.date} · ${e.category}`));
    if(e.receipt){ const link=el('a','写真を見る','receipt'); link.href=e.receipt; link.target='_blank'; link.rel='noopener'; info.append(link); }
    const edit=el('button','編集'); edit.type='button'; edit.onclick=()=>open(e); const del=el('button','削除'); del.type='button'; del.onclick=()=>{ if(confirm('この記録と写真を削除しますか？')) { try { save(entries.filter(x=>x.id!==e.id)); render(); } catch { alert('削除できませんでした。'); } } };
    row.append(info,el('span',`${e.type==='income'?'+':'−'}${yen(e.amount)}`,'amount '+e.type),edit,del); list.append(row);
  }
  const box=$('breakdown'); box.replaceChildren(); const categories=Object.entries(s.categories).sort((a,b)=>b[1]-a[1]);
  if(!categories.length) box.append(el('div','支出を記録すると\n内訳が表示されます。','empty'));
  for(const [name,value] of categories){const line=el('div',null,'category-line');line.append(el('span',name),el('strong',yen(value)));const bar=el('div',null,'bar'),fill=el('div');fill.style.width=`${100*value/s.expense}%`;bar.append(fill);box.append(line,bar);}
}
function open(entry=null) { editing=entry; form.reset(); form.elements.date.value=entry?.date || today(); form.elements.type.value=entry?.type || 'expense'; form.elements.amount.value=entry?.amount || ''; form.elements.category.value=entry?.category || ''; form.elements.memo.value=entry?.memo || ''; $('form-title').textContent=entry?'記録を編集':'記録を追加'; $('error').textContent=''; $('receipt-preview').replaceChildren(); $('remove-receipt-label').hidden=!entry?.receipt; if(entry?.receipt){const img=el('img');img.src=entry.receipt;img.alt='保存済みのレシート';$('receipt-preview').append(img);} $('dialog').showModal(); }
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('写真を読み込めませんでした'));reader.readAsDataURL(file);});}
form.onsubmit=async event=>{event.preventDefault(); const submit=form.querySelector('[type=submit]'); submit.disabled=true; $('error').textContent=''; try { const file=form.elements.receipt.files[0]; if(file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>2_000_000)) throw Error('写真はJPEG・PNG・WebPで2 MB以下にしてください'); let receipt=editing?.receipt || null; if(form.elements.removeReceipt.checked) receipt=null; if(file) receipt=await readFile(file); const e=validateRecord({id:editing?.id || crypto.randomUUID(),type:form.elements.type.value,date:form.elements.date.value,amount:Number(form.elements.amount.value),category:form.elements.category.value,memo:form.elements.memo.value.trim(),receipt}); const next=editing?entries.map(x=>x.id===editing.id?e:x):[...entries,e]; monthlySummary(next,e.date.slice(0,7)); save(next); const [y,m]=e.date.split('-').map(Number);current=new Date(y,m-1,1);$('dialog').close();render(); } catch(e){$('error').textContent=e.name==='QuotaExceededError'?'保存容量が足りません。バックアップを取り、写真のサイズを減らしてください。':e.message || '保存できませんでした。';} finally{submit.disabled=false;} };
$('new').onclick=()=>open(); $('close').onclick=$('cancel').onclick=()=>$('dialog').close(); $('prev').onclick=()=>{current.setMonth(current.getMonth()-1);render();}; $('next').onclick=()=>{current.setMonth(current.getMonth()+1);render();}; $('today').onclick=()=>{current=new Date();current.setDate(1);render();};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,entries},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`budget-book-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>20_000_000)throw Error('バックアップが大きすぎます');const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.entries))throw Error('対応していないバックアップです');const restored=data.entries.map(validateRecord);if(new Set(restored.map(x=>x.id)).size!==restored.length)throw Error('重複した記録IDがあります');for(const month of new Set(restored.map(x=>x.date.slice(0,7))))monthlySummary(restored,month);if(!confirm('このブラウザの全記録をバックアップの内容で置き換えます。続けますか？'))return;save(restored);render();alert('復元しました。');}catch(err){alert(`復元できませんでした：${err.message}`);}finally{e.target.value='';}};
render();
