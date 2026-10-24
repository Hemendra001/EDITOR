import {renderPage} from './engine.js';

const color = rgb => '#'+rgb.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
export function sampleColors(canvas, box) {
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const x=Math.max(0,Math.floor(box.x)),y=Math.max(0,Math.floor(box.y));
  const w=Math.max(1,Math.min(canvas.width-x,Math.ceil(box.width))),h=Math.max(1,Math.min(canvas.height-y,Math.ceil(box.height)));
  if(x>=canvas.width||y>=canvas.height)return {background:'#ffffff',color:'#000000'};
  const {data}=ctx.getImageData(x,y,w,h),counts=new Map();
  for(let i=0;i<data.length;i+=4){const key=[data[i],data[i+1],data[i+2]].map(v=>Math.round(v/8)*8).map(v=>Math.min(255,v)).join(',');counts.set(key,(counts.get(key)||0)+1)}
  const bg=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0].split(',').map(Number)||[255,255,255];
  let foreground=[0,0,0],distance=0;
  for(const [key,count]of counts){if(count<2)continue;const rgb=key.split(',').map(Number),d=rgb.reduce((n,v,i)=>n+(v-bg[i])**2,0);if(d>distance){foreground=rgb;distance=d}}
  return {background:color(bg),color:color(foreground)};
}
export function paintReplacement(ctx,run,width,height,{maskOnly=false}={}){
  const sx=width/run.pageWidth,sy=height/run.pageHeight;
  ctx.save();ctx.scale(sx,sy);ctx.translate(run.x,run.baseline);ctx.rotate(run.angle||0);
  ctx.fillStyle=run.background;ctx.fillRect(-.6,-run.ascent*run.originalSize-.6,run.width+1.2,run.originalSize*(run.ascent+run.descent)+1.2);
  if(!maskOnly&&run.text){ctx.fillStyle=run.color;ctx.font=`${run.italic?'italic ':''}${run.bold?'bold ':''}${run.size}px ${run.font}`;ctx.textBaseline='alphabetic';run.text.split('\n').forEach((line,i)=>ctx.fillText(line,0,i*run.size*1.25))}
  ctx.restore();
}
export async function detectText(pdf,pageNumber,canvas){
  const page=await pdf.getPage(pageNumber),viewport=page.getViewport({scale:1});
  await page.getOperatorList();
  const content=await page.getTextContent(),runs=[];
  for(const [index,item]of content.items.entries()){
    if(!item.str?.trim())continue;
    const style=content.styles[item.fontName]||{},v=viewport.transform,t=item.transform;
    const tx=[v[0]*t[0]+v[2]*t[1],v[1]*t[0]+v[3]*t[1],v[0]*t[2]+v[2]*t[3],v[1]*t[2]+v[3]*t[3],v[0]*t[4]+v[2]*t[5]+v[4],v[1]*t[4]+v[3]*t[5]+v[5]];
    const size=Math.hypot(tx[2],tx[3]);if(!size)continue;
    let face;try{face=page.commonObjs.get(item.fontName)}catch{}
    const family=style.fontFamily||'sans-serif',font=face?.loadedName?`"${face.loadedName}", ${family}`:family;
    const ascent=style.ascent??.8,descent=Math.abs(style.descent??.2),angle=Math.atan2(tx[1],tx[0]);
    const scale=canvas.width/viewport.width;
    const colors=sampleColors(canvas,{x:tx[4]*scale,y:(tx[5]-ascent*size)*scale,width:Math.max(item.width,2)*scale,height:size*(ascent+descent)*scale});
    runs.push({id:`${pageNumber}:${index}`,page:pageNumber,original:item.str,text:item.str,x:tx[4],baseline:tx[5],width:Math.max(item.width,size*.25),originalSize:size,size,ascent,descent,angle,font,originalFont:font,fontLabel:face?.name||family,bold:false,italic:false,...colors,pageWidth:viewport.width,pageHeight:viewport.height,source:'PDF text'});
  }
  return runs;
}
export async function recognizeText(pdf,pageNumber,onProgress){
  const tesseract=await import('tesseract.js');const createWorker=tesseract.createWorker||tesseract.default?.createWorker;
  const worker=await createWorker('eng',1,{workerPath:'/assets/ocr/worker.min.js',corePath:'/assets/ocr/tesseract-core-lstm.wasm.js',langPath:'/assets/ocr',logger:m=>m.status&&onProgress(`${m.status} ${Math.round((m.progress||0)*100)}%`)});
  try{
    const canvas=await renderPage(pdf,pageNumber,2),page=await pdf.getPage(pageNumber),v=page.getViewport({scale:1});
    const {data}=await worker.recognize(canvas,{}, {blocks:true,text:true});const runs=[];
    for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){
      const text=(line.text||line.words?.map(w=>w.text).join(' ')||'').trim();if(!text)continue;
      const b=line.bbox,sx=v.width/canvas.width,sy=v.height/canvas.height,size=(b.y1-b.y0)*sy;
      runs.push({id:`ocr:${pageNumber}:${runs.length}`,page:pageNumber,original:text,text,x:b.x0*sx,baseline:b.y1*sy,width:(b.x1-b.x0)*sx,originalSize:size,size,ascent:1,descent:.15,angle:0,font:'sans-serif',originalFont:'sans-serif',fontLabel:'OCR estimate',bold:false,italic:false,...sampleColors(canvas,{x:b.x0,y:b.y0,width:b.x1-b.x0,height:b.y1-b.y0}),pageWidth:v.width,pageHeight:v.height,source:'OCR estimate'});
    }
    return runs;
  }finally{await worker.terminate()}
}
