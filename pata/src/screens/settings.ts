// Settings.
//
// Deliberately boring: PATA needs no account, no sign-up, no API key and no
// internet. A teacher never has to configure anything here for the app to do
// its whole job.
//
// The optional AI section exists for a district or NGO rolling the app out
// with a key of their own; it is collapsed by default and framed as "extra",
// never as something missing. Nothing in the app nags for it.
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

      <div class="paper">
        <p><b>${esc(t('setNoAccountTitle'))}</b></p>
        <p>${esc(t('setNoAccount'))}</p>
      </div>

      <h3>${esc(t('setVoiceTitle'))}</h3>
      <p class="sub">${esc(t('setVoiceHelp'))}</p>

      <details class="advanced" ${key ? 'open' : ''}>
        <summary>${esc(t('setAdvanced'))}</summary>
        <p class="sub small">${esc(t('aiIntro'))}</p>
        ${on ? `<p class="ai-on">${esc(t('aiOn'))}</p>` : ''}
        <form id="keyForm" class="paper report-form">
          <label>${esc(t('aiKeyLabel'))}
            <input type="password" name="key" value="${esc(key)}" autocomplete="off"
                   spellcheck="false" placeholder="${esc(t('setKeyEmpty'))}" />
          </label>
          <p class="tiny">${esc(t('aiKeyHint'))}</p>
          <div class="row">
            <button type="submit" class="btn primary">${esc(t('save'))}</button>
            ${key ? `<button type="button" class="btn ghost" id="clearKey">${esc(t('setClearKey'))}</button>` : ''}
          </div>
        </form>
      </details>
    </div>`);
  root.appendChild(screen);

  const form = screen.querySelector<HTMLFormElement>('#keyForm')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await setApiKey(String(new FormData(form).get('key') ?? ''));
    toast(t('aiSaved'));
    renderSettings(root);
  });
  screen.querySelector('#clearKey')?.addEventListener('click', async () => {
    await setApiKey('');
    toast(t('setKeyCleared'));
    renderSettings(root);
  });
}
