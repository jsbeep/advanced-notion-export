import { CHECK_ICON } from '../codeIcons';

/**
 * Delegated click handler for the copy button, shipped as a real <script> tag rather than a
 * per-button onclick="" attribute. Many blog/CMS sanitizers (Tistory included) strip inline event
 * attributes from pasted HTML but leave <script> tags alone, so this is the version that actually
 * survives being pasted into a real site.
 */
export function buildCodeBlockScriptTag(): string {
  return `<script>(function(){
document.addEventListener('click', function(e){
  var btn = e.target.closest('[data-anx-action]');
  if (!btn) return;
  var block = btn.closest('.anx-code-block');
  if (!block) return;
  e.stopPropagation();
  if (btn.getAttribute('data-anx-action') === 'copy') {
    var code = block.querySelector('code');
    if (code && navigator.clipboard) navigator.clipboard.writeText(code.innerText);
    var original = btn.innerHTML;
    btn.innerHTML = '${CHECK_ICON}';
    setTimeout(function(){ btn.innerHTML = original; }, 1200);
  }
});
})();</script>`;
}