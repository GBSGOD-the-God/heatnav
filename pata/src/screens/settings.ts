// Settings.
//
// Deliberately boring: PATA needs no account, no password, no API key and no
// internet. A teacher never has to configure anything here.
//
// The Advanced section holds an AI *server address*, not a key — the key lives
// on that server (see server/). It is collapsed by default and framed as
// something a district might already have, never as something missing.
import { aiHealth, getProxyUrl, hasBuiltInUrl, serverVoiceOn, setProxyUrl } from '../ai';
import { t } from '../i18n';
import { el, esc, toast } from '../ui';

export async function renderSettings(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const url = await getProxyUrl();

  const screen = el(`
    <div>
      <h1>${esc(t('settingsTitle'))}</h1>

      <div class="paper">
        <p><b>${esc(t('setNoAccountTitle'))}</b></p>
        <p>${esc(t('setNoAccount'))}</p>
      </div>

      <h3>${esc(t('setVoiceTitle'))}</h3>
      <p class="tiny" id="voiceStatus">…</p>
      <p class="sub">${esc(t('setVoiceHelp'))}</p>

      <details class="advanced" ${url && !hasBuiltInUrl() ? 'open' : ''}>
        <summary>${esc(t('setAdvanced'))}</summary>
        <p class="sub small">${esc(t('aiIntro'))}</p>
        <p class="tiny" id="aiStatus">…</p>
        <form id="urlForm" class="paper report-form">
          <label>${esc(t('setServerLabel'))}
            <input type="url" name="url" value="${esc(url)}" autocomplete="off"
                   spellcheck="false" inputmode="url" placeholder="${esc(t('setServerEmpty'))}" />
          </label>
          <p class="tiny">${esc(t('setServerHint'))}</p>
          <div class="row">
            <button type="submit" class="btn primary">${esc(t('save'))}</button>
            <button type="button" class="btn ghost" id="testBtn">${esc(t('setTest'))}</button>
          </div>
        </form>
      </details>
    </div>`);
  root.appendChild(screen);

  // Natural voices are a separate, optional key on the same server. Say which
  // of the two you are getting, because they sound completely different.
  const voiceStatus = screen.querySelector('#voiceStatus')!;
  const paintVoice = async () => {
    const on = await serverVoiceOn();
    voiceStatus.textContent = t(on ? 'setVoiceNatural' : 'setVoiceDevice');
    voiceStatus.className = 'tiny ' + (on ? 'ai-on' : 'ai-off');
  };
  void paintVoice();

  const status = screen.querySelector('#aiStatus')!;
  const paintStatus = async () => {
    status.textContent = t('setChecking');
    const key = {
      ok: 'setAiOk', nokey: 'setAiNoKey',
      unreachable: 'setAiUnreachable', unset: 'setAiUnset',
    }[await aiHealth()];
    status.textContent = t(key);
    status.className = 'tiny ' + (key === 'setAiOk' ? 'ai-on' : 'ai-off');
  };
  paintStatus();

  const form = screen.querySelector<HTMLFormElement>('#urlForm')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await setProxyUrl(String(new FormData(form).get('url') ?? ''));
    toast(t('aiSaved'));
    paintStatus();
  });
  screen.querySelector('#testBtn')!.addEventListener('click', () => { paintStatus(); void paintVoice(); });
}
