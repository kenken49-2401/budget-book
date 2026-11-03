// 金額は円単位の整数。保存先に依存しない基本処理。
export function validateEntry(entry) {
  if (!entry || !['income', 'expense'].includes(entry.type)) throw new Error('種類を選んでください');
  if (!Number.isSafeInteger(entry.amount) || entry.amount <= 0) throw new Error('金額は1円以上の整数で入力してください');
  if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) throw new Error('日付を入力してください');
  const date = new Date(`${entry.date}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== entry.date) throw new Error('正しい日付を入力してください');
  if (typeof entry.category !== 'string' || !entry.category.trim()) throw new Error('カテゴリーを入力してください');
  return { ...entry, category: entry.category.trim() };
}
export function monthlySummary(entries, month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('月はYYYY-MM形式で入力してください');
  let income = 0, expense = 0;
  const categories = Object.create(null);
  for (const raw of entries) {
    const entry = validateEntry(raw);
    if (!entry.date.startsWith(month + '-')) continue;
    if (entry.type === 'income') income += entry.amount;
    else { expense += entry.amount; categories[entry.category] = (categories[entry.category] || 0) + entry.amount; }
    if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expense)) throw new Error('合計金額が大きすぎます');
  }
  return { income, expense, balance: income - expense, categories };
}
