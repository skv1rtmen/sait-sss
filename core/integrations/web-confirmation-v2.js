const r=$input.first().json||{},f=$('Felder Lesen').first().json||{};
if(r.ok!==true||r.doppelt===true||!f.email||f.email.indexOf('@')<0)return [];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mappe=f.gewerk==='Referenzmappe PDF';
const pdf='https://www.baustern.ch/downloads/baustern-referenzen-v1.pdf';
const content=mappe?'<p>Vielen Dank für Ihr Interesse an BauStern. Ihre Referenzmappe mit sechs Projektbeispielen und dem Ablauf einer Zusammenarbeit steht hier bereit:</p><p><a href="'+pdf+'" style="display:inline-block;padding:14px 20px;background:#1c1f22;color:white;text-decoration:none">Referenzmappe als PDF herunterladen</a></p><p>Fünf Seiten, ca. 1 MB. Sie können die Datei auch später über diesen Link öffnen.</p>':'<p>Vielen Dank für Ihre Anfrage'+(f.gewerk?' zu <b>'+esc(f.gewerk)+'</b>':'')+'. Wir haben sie gespeichert und melden uns innert 24 Stunden (Werktage) bei Ihnen.</p><p>Sie möchten noch etwas ergänzen? Antworten Sie einfach auf diese E-Mail.</p>';
const html='<div style="font-family:Arial,sans-serif;color:#1c1f22;max-width:560px;font-size:15px;line-height:1.6"><h2>BauStern</h2><p>Guten Tag'+(!mappe&&f.name?' '+esc(f.name):'')+',</p>'+content+'<p>Ihre Referenz: <b>'+esc(r.nr)+'</b></p><p style="color:#58646d;font-size:13px">BauStern · Zürich · +41 76 524 98 98 · info@baustern.ch</p></div>';
return [{json:{an:f.email,betreff:(mappe?'Ihre BauStern Referenzmappe':'Ihre Anfrage ist angekommen')+' ('+r.nr+')',html}}];
