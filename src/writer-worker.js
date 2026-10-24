import {pipeline,env} from '@huggingface/transformers';
import {smoothText} from './review-engine.js';
import {reviewRewrite} from './rewrite-quality.js';
env.allowLocalModels=true;env.allowRemoteModels=false;env.localModelPath='/models/';env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.wasmPaths='/assets/onnx/';
let writer;
self.onmessage=async({data})=>{try{
 writer??=await pipeline('text-generation','onnx-community/Qwen2.5-0.5B-Instruct',{dtype:'q8',device:'wasm',progress_callback:p=>self.postMessage({progress:p.status==='progress'?`Loading writing model: ${Math.round(p.progress||0)}%`:'Preparing the writing model…'})});
 const output=[],notes=[];
 for(let i=0;i<data.parts.length;i++){
  self.postMessage({progress:`Rewriting passage ${i+1} of ${data.parts.length}…`});
  const clean=smoothText(data.parts[i]).text;
  const result=await writer([{role:'system',content:'You are a copy editor. Rewrite the supplied text in natural, clear English. Preserve all facts, numbers, names, negations and citations. Return only the rewritten text, without explanation or added information.'},{role:'user',content:clean}],{max_new_tokens:384,do_sample:false,return_full_text:false,repetition_penalty:1.05});
  const generated=result[0]?.generated_text;
  const text=(typeof generated==='string'?generated:generated?.at(-1)?.content)?.trim();
  if(!text)throw Error('No rewrite was generated. Try a shorter passage.');
  const checked=reviewRewrite(data.parts[i],text);output.push(checked.text);if(checked.reason)notes.push(`Passage ${i+1}: ${checked.reason}`);
 }
 self.postMessage({output,notes});
}catch(e){self.postMessage({error:'Could not generate the rewrite. '+e.message})}};
