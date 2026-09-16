const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
(async () => {
  const base = process.env.BASE;
  assert(base, 'BASE required');
  const root = path.resolve(__dirname, '../../site');
  const names = ['img/film/mat5/step0.webp', 'img/film/mat5/step6.webp', 'img/film/scrim-v13.webp', 'downloads/baustern-referenzen-v1.pdf'];
  const files = [];
  for (const name of names) {
    const response = await fetch(base + '/' + name);
    assert.equal(response.status, 200, name);
    const body = Buffer.from(await response.arrayBuffer());
    const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
    assert.equal(sha(body), sha(fs.readFileSync(path.join(root, name))), 'Stale bytes: ' + name);
    const cache = response.headers.get('cache-control'), type = response.headers.get('content-type');
    if (name.startsWith('img/film/')) assert(cache.includes('immutable'), name);
    if (name.endsWith('.pdf')) { assert(type.includes('application/pdf')); assert.equal(body.subarray(0, 5).toString(), '%PDF-'); }
    else assert(type.includes('image/webp'), name);
    files.push({ name, bytes: body.length, type, cache, hashMatch: true });
  }
  const html = await (await fetch(base + '/')).text();
  const rendered = html.split('<!--prerender:start-->')[1]?.split('<!--prerender:end-->')[0];
  assert(rendered && rendered.includes('w-fx') && rendered.includes('<picture') && rendered.includes('s13/') && rendered.includes('poster-v13'), 'Prerender content stale');
  fs.writeFileSync(process.env.REPORT || 'reports/release-content-final.json', JSON.stringify({ base, files, prerender: true }, null, 2));
  console.log('RELEASE CONTENT PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
