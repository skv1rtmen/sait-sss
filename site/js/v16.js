/* v16 (16.09.2026) — Stufe 1: Markenbegriffe vor der Chrome-Autoübersetzung schützen; Stufe 6: Sticky-Rückruf. */
(function(){
  var SPLIT=/\b(BauStern|Gewerke?)\b/;
  var SKIP=/^(SCRIPT|STYLE|TEXTAREA|OPTION|SELECT|TITLE|CODE|NOSCRIPT)$/i;
  function wrap(root){
    if(!root||!document.createTreeWalker)return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentNode;
      if(!p||p.nodeType!==1||SKIP.test(p.nodeName)||p.closest('[translate="no"],svg'))return NodeFilter.FILTER_REJECT;
      return SPLIT.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}});
    var list=[];while(w.nextNode())list.push(w.currentNode);
    list.forEach(function(n){var parts=n.nodeValue.split(SPLIT);if(parts.length<2)return;var f=document.createDocumentFragment();
      parts.forEach(function(t,i){if(!t)return;if(i%2){var s=document.createElement('span');s.setAttribute('translate','no');s.textContent=t;f.appendChild(s);}else f.appendChild(document.createTextNode(t));});
      n.parentNode.replaceChild(f,n);});
  }
  var t=0;function soon(){clearTimeout(t);t=setTimeout(function(){wrap(document.body);},400);}
  function start(){wrap(document.body);if(window.MutationObserver)new MutationObserver(soon).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cb]');if(!b)return;e.preventDefault();var o=document.getElementById('cbOpen');if(o)o.click();});
})();
