import {tmpdir} from 'node:os';
import {join} from 'node:path';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {createCanvas,DOMMatrix,Path2D,ImageData} from '@napi-rs/canvas';Object.assign(globalThis,{DOMMatrix,Path2D,ImageData});Uint8Array.prototype.toHex??=function(){return Buffer.from(this).toString('hex')};Math.sumPrecise??=xs=>Array.from(xs).reduce((a,b)=>a+b,0);
Map.prototype.getOrInsertComputed??=function(key,fn){if(!this.has(key))this.set(key,fn(key));return this.get(key)};
Map.prototype.getOrInsert??=function(key,value){if(!this.has(key))this.set(key,value);return this.get(key)};
const E=await import('../src/engine.js');const {detectText}=await import('../src/text-editing.js');const {exportEditedPdf}=await import('../src/editor-export.js');
const pdfjs=await import('pdfjs-dist/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('../node_modules/pdfjs-dist/build/pdf.worker.mjs',import.meta.url).href;
globalThis.fetch=async()=>new Response(await fs.readFile('dist/fonts/NotoSans-Regular.ttf'));
const input=await E.PDFDocument.create();const font=await input.embedFont(E.StandardFonts.Helvetica);const page=input.addPage([595,842]);page.drawText('Replace this sentence.',{x:50,y:730,size:18,font});page.drawText('Delete this private line.',{x:50,y:680,size:14,font});
const data=await input.save();const pdf=await E.readPdf(new File([data],'source.pdf'));
async function renderPage(pdf,i,scale){const p=await pdf.getPage(i),v=p.getViewport({scale}),c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:c.getContext('2d'),viewport:v,background:'#fff'}).promise;c.toBlob=cb=>cb(new Blob([c.toBuffer('image/png')],{type:'image/png'}));return c}
const canvas=await renderPage(pdf,1,1.6);const runs=await detectText(pdf,1,canvas);assert.equal(runs.length,2);assert.equal(runs[0].size,18);assert.equal(runs[1].size,14);
const edited=await exportEditedPdf({pdf,textRuns:new Map([[1,runs]]),edits:[{...runs[0],text:'Edited characters at the same size.'},{...runs[1],text:''}],renderPage});
await fs.writeFile(join(tmpdir(),'ihatepdf-edited-verified.pdf'),edited);
const text=(await E.pdfText(new File([edited],'edited.pdf'))).join(' ');assert.match(text,/Edited characters at the same size/);assert.ok(!text.includes('Replace this'));assert.ok(!text.includes('private line'));
const roundtrip=await E.readPdf(new File([edited],'edited.pdf'));const detectedAgain=await detectText(roundtrip,1,await renderPage(roundtrip,1,1));assert.equal(detectedAgain[0].size,18,'editable text must retain 18pt on reimport');await roundtrip.destroy();await pdf.destroy();
console.log('Editor export passed: detects font sizes, replacement text searchable, deleted text absent, original text absent, reopened size preserved.');
