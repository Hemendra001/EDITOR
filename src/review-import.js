import * as E from './engine.js';
export async function importReviewFile(file,onProgress=()=>{}){
 if(file.size>20*1024*1024)throw Error('Choose a file under 20 MB.');
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf'){
  const pdf=await E.readPdf(file),pages=[],emptyPages=[],ocrPages=[];let columns=false;
  try{for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),content=await page.getTextContent(),view=page.getViewport({scale:1});let text='',lastY=null;const xs=[];for(const item of content.items){if(!item.str)continue;const y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>3)text+='\n';else if(text&&!text.endsWith('\n'))text+=' ';text+=item.str;if(item.hasEOL)text+='\n';lastY=y;if(item.str.trim().length>20)xs.push(item.transform[4]/view.width)}if(!text.trim()){onProgress(`Recognizing scanned page ${i} of ${pdf.numPages}…`);const {recognizeText}=await import('./text-editing.js');const runs=await recognizeText(pdf,i,onProgress);text=runs.map(r=>r.text).join('\n');ocrPages.push(i)}pages.push(text.trim());if(!text.trim())emptyPages.push(i);if(xs.filter(x=>x<.3).length>=3&&xs.filter(x=>x>.45).length>=3)columns=true}}
  finally{pdf.destroy()}return {text:pages.join('\n\n'),meta:{pages:pages.length,emptyPages,ocrPages,columns,fileName:file.name}};
 }
 if(ext==='docx')return {text:await E.wordToText(file),meta:{fileName:file.name}};
 if(['txt','md'].includes(ext))return {text:await file.text(),meta:{fileName:file.name}};
 throw Error('Choose PDF, DOCX, TXT or Markdown.');
}
