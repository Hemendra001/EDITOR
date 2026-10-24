import PDFKit, {registerStdFonts} from 'pdfkit';
import Helvetica from 'pdfkit/standard-fonts/Helvetica';
import {toBytes} from 'pdfkit/output';
registerStdFonts(Helvetica);
import {readPdf,renderPage,canvasBytes} from './engine.js';
export async function protectPdf(file,password,status){const pdf=await readPdf(file);try{const document=new PDFKit({autoFirstPage:false,userPassword:password,ownerPassword:crypto.randomUUID(),pdfVersion:'1.7ext3',permissions:{printing:'highResolution',modifying:false,copying:false,annotating:false,fillingForms:false,contentAccessibility:true,documentAssembly:false}});const finished=toBytes(document);for(let i=1;i<=pdf.numPages;i++){status(`Protecting page ${i} of ${pdf.numPages}…`);const page=await pdf.getPage(i),v=page.getViewport({scale:1}),c=await renderPage(pdf,i,1.5);document.addPage({size:[v.width,v.height],margin:0});document.image(c.toDataURL('image/jpeg',.94),0,0,{width:v.width,height:v.height})}document.end();return await finished}finally{pdf.destroy()}}
