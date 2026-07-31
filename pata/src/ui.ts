// Tiny DOM helpers — no framework needed at this size (spec §8).

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}

export function el(html: string): HTMLElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild as HTMLElement;
}

export function toast(msg: string): void {
  document.querySelector('.toast')?.remove();
  const node = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(node);
  setTimeout(() => node.classList.add('show'), 10);
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, 2200);
}

export function go(hash: string): void {
  location.hash = hash;
}
