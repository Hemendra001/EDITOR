import PDFKit from 'pdfkit';
import {toBytes} from 'pdfkit/output';
export function translationChunks(text,max=300){
  const chunks=[];
  for(const sentence of text.match(/[^.!?।\n]+[.!?।]?/g)||[]){
    let current='';
    for(const word of sentence.trim().split(/\s+/)){
      if(current.length+word.length+1>max&&current){chunks.push(current);current=''}
      if(word.length>max){if(current){chunks.push(current);current=''}for(let i=0;i<word.length;i+=max)chunks.push(word.slice(i,i+max));continue}
      current+=(current?' ':'')+word;
    }
    if(current)chunks.push(current);
  }
  return chunks;
}
export function translateText(text,direction,onProgress,signal){
  const texts=translationChunks(text);if(!texts.length)throw Error('No selectable text found. Run OCR first for an English scan.');
  const worker=new Worker('/assets/translation-worker.js',{type:'module'});
  return new Promise((resolve,reject)=>{
    let timer;const cancel=()=>{clearTimeout(timer);worker.terminate();reject(Error('Translation cancelled.'))};signal?.addEventListener('abort',cancel,{once:true});const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>{worker.terminate();reject(Error('Translation timed out. Try fewer pages or retry the language-model download.'))},180000)};reset();
    worker.onmessage=({data})=>{reset();if(data.progress)onProgress(data.progress);else{clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();if(data.error)reject(Error(data.error));else resolve(data.output.join('\n\n'))}};
    worker.onerror=e=>{signal?.removeEventListener('abort',cancel);clearTimeout(timer);worker.terminate();reject(Error(e.message||'The translation engine could not start.'))};
    worker.postMessage({id:1,texts,direction});
  });
}
export async function translatedPdf(text,title){
  const load=async name=>{const r=await fetch('/fonts/'+name);if(!r.ok)throw Error('Could not load the translation font.');return new Uint8Array(await r.arrayBuffer())};
  const [latin,hindi]=await Promise.all([load('NotoSans-Regular.ttf'),load('NotoSansDevanagari-Regular.ttf')]);
  const doc=new PDFKit({font:latin,size:'A4',margin:48,info:{Title:title,Creator:'I Hate PDF'}}),finished=toBytes(doc);
  doc.registerFont('Latin',latin);doc.registerFont('Hindi',hindi);
  doc.font('Latin').fontSize(18).text(title).moveDown();doc.fontSize(12);
  for(const paragraph of text.split(/\n\s*\n/)){
    const runs=paragraph.match(/[\u0900-\u097f\s]+|[^\u0900-\u097f\s]+/g)||[];
    runs.forEach((run,i)=>doc.font(/[\u0900-\u097f]/.test(run)?'Hindi':'Latin').text(run,{continued:i<runs.length-1}));doc.moveDown(.6);
  }
  doc.end();return await finished;
}
