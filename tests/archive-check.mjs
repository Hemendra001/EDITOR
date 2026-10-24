import fs from 'node:fs/promises';
import {createCanvas,DOMMatrix,Path2D,ImageData} from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,Path2D,ImageData});
const {archiveDocument}=await import('../src/pdfa.js');
const {toBytes}=await import('pdfkit/output');
const profile=await fs.readFile('node_modules/pdfkit/js/data/sRGB_IEC61966_2_1.icc');
const font=await fs.readFile('dist/fonts/NotoSans-Regular.ttf');
const c=createCanvas(600,800),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,600,800);ctx.fillStyle='#17251e';ctx.font='22px sans-serif';ctx.fillText('Archival conversion test',40,80);
const doc=archiveDocument(profile,font,'Archival test');const output=toBytes(doc);doc.addPage({size:[600,800],margin:0});doc.image(c.toBuffer('image/jpeg'),0,0,{width:600,height:800});doc.end();await fs.writeFile('/private/tmp/ihatepdf-archive.pdf',await output);console.log('Archival fixture created');
