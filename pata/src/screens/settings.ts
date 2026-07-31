// Settings: the teacher's own Anthropic API key, stored only in IndexedDB on
// this device (no backend, no accounts — spec §10). With a key + internet the
// AI features go live; without them the app runs on its offline bank.
import { aiAvailable, getApiKey, setApiKey } from '../ai';
import { t } from '../i18n';
import { el, esc, toast } from '../ui';

export async function renderSettings(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const key = await getApiKey();
  const on = await aiAvailable();

  const screen = el(`
    <div>
      <h1>${esc(t('settingsTitle'))}</h1>
      <h3>${esc(t('aiTitle'))}</h3>
      <p class="sub">${esc(t('aiIntro'))}</p>
      <p class="${on ? 'ai-on' : 'ai-off'}">${esc(on ? t('aiOn') : t('aiOff'))}</p>
      <form id="keyForm" class="paper report-form">
        <label>${esc(t('aiKeyLabel'))}
          <input type="password" name="key" value="${esc(key)}" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." />
        </label>
        <p class="tiny">${esc(t('aiKeyHint'))}</p>
        <button type="submit" class="btn primary big">${esc(t('save'))}</button>
      </form>
      <p class="tiny">${esc(t('ttsVoiceNote'))}</p>
    </div>`);
  root.appendChild(screen);

  const form = screen.querySelector<HTMLFormElement>('#keyForm')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await setApiKey(String(new FormData(form).get('key') ?? ''));
    toast(t('aiSaved'));
    renderSettings(root);
  });
}
