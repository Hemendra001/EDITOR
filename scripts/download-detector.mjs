import fs from 'node:fs/promises';
import path from 'node:path';
import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const files=['config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','README.md','onnx/model_quantized.onnx'];
for(const model of ['onnx-community/tmr-ai-text-detector-ONNX']){
  for(const name of files){
    const target=path.join('dist/models',model,name);await fs.mkdir(path.dirname(target),{recursive:true});
    if(await fs.stat(target).then(s=>s.size>0).catch(()=>false))continue;
    console.log(`Downloading ${model}/${name}`);
    const response=await fetch(`https://huggingface.co/${model}/resolve/b9aa251e5bcda7e429fcc936767d921435945b60/${name}`,{signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw Error(`Model download failed: ${response.status} ${name}`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(target+'.part'));
    await fs.rename(target+'.part',target);
  }
}
console.log('Detector model is ready.');
