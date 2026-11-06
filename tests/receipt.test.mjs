import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseReceipt} from '../src/receipt.mjs';
test('合計と品名を読み取り同じジャンルを推定',()=>{const x=parseReceipt('牛乳 １９８\n食パン ¥150\n小計 348\n消費税 27\n合計 ¥375\nお預り 1,000\nお釣り 625');assert.equal(x.total,375);assert.deepEqual(x.items.map(x=>x.name),['牛乳','食パン']);assert.equal(x.category,'食費');});
test('小計・預りだけでは合計を推定しない',()=>{const x=parseReceipt('洗剤 300\n小計 300\nお預り 1000\nお釣り 700');assert.equal(x.total,null);assert.equal(x.category,'日用品');});
test('混在や不明な商品はカテゴリーを勝手に確定しない',()=>{assert.equal(parseReceipt('牛乳 200\n洗剤 400\n合計 600').category,null);assert.equal(parseReceipt('牛乳 200\nナゾノ品 400\n合計 600').category,null);});
test('次行の合計と空入力に対応',()=>{assert.equal(parseReceipt('合計\n¥1,234').total,1234);assert.equal(parseReceipt('').total,null);});
