import {pipeline,env} from '@huggingface/transformers';
env.allowLocalModels=true;
env.allowRemoteModels=false;
env.localModelPath='/models/';
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths='/assets/onnx/';
const translators=new Map();
self.onmessage=async({data})=>{
  const {id,texts,direction}=data;
  try{
    if(!['en-hi','hi-en'].includes(direction))throw Error('Choose English to Hindi or Hindi to English.');
    let translator=translators.get(direction);
    if(!translator){
      translator=await pipeline('translation',`Xenova/opus-mt-${direction}`,{dtype:'q8',device:'wasm',progress_callback:p=>{
        if(p.status==='progress')self.postMessage({id,progress:`Downloading language model: ${Math.round(p.progress||0)}%`});
        else if(p.status==='initiate')self.postMessage({id,progress:'Preparing language model. The first download may take several minutes…'});
      }});translators.set(direction,translator);
    }
    const output=[];
    for(let i=0;i<texts.length;i++){
      self.postMessage({id,progress:`Translating section ${i+1} of ${texts.length}…`});
      const result=await translator(texts[i],{max_new_tokens:512,num_beams:3});
      const translated=result[0]?.translation_text;if(!translated?.trim())throw Error('The model returned no translation. Try a shorter section.');output.push(translated);
    }
    self.postMessage({id,output});
  }catch(e){self.postMessage({id,error:'Translation could not finish. Check your connection for the first model download, then try again. '+e.message})}
};
