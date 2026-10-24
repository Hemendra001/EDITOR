import {pipeline,env} from '@huggingface/transformers';
env.allowLocalModels=true;env.allowRemoteModels=false;env.localModelPath='/models/';env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.wasmPaths='/assets/onnx/';
self.onmessage=async({data})=>{try{
const classifier=await pipeline('text-classification','onnx-community/tmr-ai-text-detector-ONNX',{dtype:'q8',device:'wasm',progress_callback:p=>self.postMessage({progress:p.status==='progress'?`Loading detector: ${Math.round(p.progress||0)}%`:'Preparing the local detector…'})});
const ids=classifier.tokenizer.encode(data.text,{add_special_tokens:false}),passages=[];
for(let i=0;i<ids.length;i+=480){self.postMessage({progress:`Checking passage ${Math.floor(i/480)+1} of ${Math.ceil(ids.length/480)}…`});const tokens=ids.slice(i,i+480),text=classifier.tokenizer.decode(tokens,{skip_special_tokens:true});const result=await classifier(text,{top_k:null,truncation:true,max_length:512});const ai=result.flat().find(r=>r.label.toLowerCase()==='ai');if(!ai)throw Error('The model returned an unexpected label.');passages.push({score:ai.score,tokens:tokens.length,text});}
self.postMessage({passages});
}catch(e){self.postMessage({error:'AI-writing check failed: '+e.message})}};
