import PDFKit from 'pdfkit';
import {toBytes} from 'pdfkit/output';
import {readPdf,renderPage,canvasBytes} from './engine.js';

export function archiveDocument(profile,font,title='Archival document'){
  const document=new PDFKit({autoFirstPage:false,font,subset:'PDF/A-2b',pdfVersion:'1.7',info:{Title:title,Creator:'I Hate PDF',Subject:'Flattened archival copy'}});
  // Supply the bundled ICC bytes explicitly; PDFKit's default loader uses Node fs.
  document._addColorOutputIntent=function(){
    const colorProfile=this.ref({N:3});colorProfile.end(profile);
    const intent=this.ref({Type:'OutputIntent',S:'GTS_PDFA1',Info:new String('sRGB IEC61966-2.1'),OutputConditionIdentifier:new String('sRGB IEC61966-2.1'),DestOutputProfile:colorProfile});intent.end();this._root.data.OutputIntents=[intent];
  };
  return document;
}
async function bytes(url){const r=await fetch(url);if(!r.ok)throw Error('Could not load the archival export resources.');return new Uint8Array(await r.arrayBuffer())}
export async function archivePdf(file,status){
  const [profile,font]=await Promise.all([bytes('/assets/sRGB_IEC61966_2_1.icc'),bytes('/fonts/NotoSans-Regular.ttf')]);
  const pdf=await readPdf(file);
  try{
    const document=archiveDocument(profile,font,file.name.replace(/\.pdf$/i,''));const finished=toBytes(document);
    for(let i=1;i<=pdf.numPages;i++){
      status(`Creating archival page ${i} of ${pdf.numPages}…`);
      const page=await pdf.getPage(i),v=page.getViewport({scale:1}),canvas=await renderPage(pdf,i,2);
      document.addPage({size:[v.width,v.height],margin:0});document.image(await canvasBytes(canvas,'image/jpeg',.98),0,0,{width:v.width,height:v.height});
    }
    document.end();return await finished;
  }finally{pdf.destroy()}
}
