import fs from 'node:fs/promises';
import path from 'node:path';
import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const files=['config.json','generation_config.json','tokenizer.json','tokenizer_config.json','onnx/model_quantized.onnx'];
for(const model of ['onnx-community/Qwen2.5-0.5B-Instruct']){
  for(const name of files){
    const target=path.join('dist/models',model,name);await fs.mkdir(path.dirname(target),{recursive:true});
    if(await fs.stat(target).then(s=>s.size>0).catch(()=>false))continue;
    console.log(`Downloading ${model}/${name}`);
    const response=await fetch(`https://huggingface.co/${model}/resolve/main/${name}`,{signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw Error(`Model download failed: ${response.status} ${name}`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(target+'.part'));
    await fs.rename(target+'.part',target);
  }
}
console.log('Writing model is ready.');
