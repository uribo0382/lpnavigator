/**
 * HTMLタグをエスケープする関数
 * @param html HTMLタグを含む可能性のある文字列
 * @returns エスケープされた文字列
 */
export const escapeHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * HTMLタグをプレーンテキストに変換する関数
 * @param html HTMLタグを含む文字列
 * @returns HTMLタグが削除されたプレーンテキスト
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  // 一時的なDOM要素を作成してHTMLをパースし、テキストコンテンツのみを取得
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}; 