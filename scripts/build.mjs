import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

for(const direction of ['en-hi','hi-en']){
  for(const file of ['config.json','tokenizer.json','tokenizer_config.json','generation_config.json','onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx']){
    const asset=path.join('dist/models/Xenova','opus-mt-'+direction,file);
    if(!fs.existsSync(asset)||fs.statSync(asset).size===0)throw Error('Missing translation models. Run npm run setup:translation before building.');
  }
}

for(const name of ['config.json','generation_config.json','tokenizer.json','tokenizer_config.json','onnx/model_quantized.onnx']){const asset=path.join('dist/models/onnx-community/Qwen2.5-0.5B-Instruct',name);if(!fs.existsSync(asset)||fs.statSync(asset).size===0)throw Error('Missing writing model. Run npm run setup:writing.');}

for(const name of ['config.json','tokenizer.json','tokenizer_config.json','onnx/model_quantized.onnx']){const asset=path.join('dist/models/onnx-community/tmr-ai-text-detector-ONNX',name);if(!fs.existsSync(asset)||fs.statSync(asset).size===0)throw Error('Missing detector model. Run npm run setup:detector.');}

// Keep the current app usable until all replacement files are ready.
function copyAsset(from,to){
  if(fs.statSync(from).isDirectory()){fs.mkdirSync(to,{recursive:true});for(const name of fs.readdirSync(from))copyAsset(path.join(from,name),path.join(to,name));}
  else fs.writeFileSync(to,fs.readFileSync(from));
}
const staging = fs.mkdtempSync(path.join(process.cwd(), '.build-'));
try {
  for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
    copyAsset('node_modules/pdfjs-dist/' + dir, staging + '/' + dir, {recursive:true});
  }
  copyAsset('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', staging + '/pdf.worker.min.mjs');
  fs.mkdirSync(staging + '/ocr');
  copyAsset('node_modules/tesseract.js/dist/worker.min.js', staging + '/ocr/worker.min.js');
  copyAsset('node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt', staging + '/ocr/LICENSE.txt');
  for (const name of ['tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm']) {
    copyAsset('node_modules/tesseract.js-core/' + name, staging + '/ocr/' + name);
  }
  copyAsset('node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', staging + '/ocr/eng.traineddata.gz');
  copyAsset('node_modules/pdfkit/js/data/sRGB_IEC61966_2_1.icc',staging+'/sRGB_IEC61966_2_1.icc');
  fs.mkdirSync(staging+'/dictionary');
  copyAsset('node_modules/dictionary-en/license',staging+'/dictionary/LICENSE.txt');
  for(const name of ['index.aff','index.dic'])copyAsset('node_modules/dictionary-en/'+name,staging+'/dictionary/en.'+name.split('.').pop());
  fs.mkdirSync(staging+'/onnx');
  for(const name of fs.readdirSync('node_modules/onnxruntime-web/dist').filter(n=>/^ort-wasm.*\.(wasm|mjs)$/.test(n)))copyAsset('node_modules/onnxruntime-web/dist/'+name,staging+'/onnx/'+name);
  await build({entryPoints:['src/app.js','src/translation-worker.js','src/writer-worker.js','src/detector-worker.js'], bundle:true, format:'esm', outdir:staging, minify:true, splitting:true, chunkNames:'chunk-[hash]', logLevel:'info'});
  fs.mkdirSync('dist/assets', {recursive:true});
  // Publish chunks first, entrypoint last. Older open tabs keep their chunks.
  function publish(from, to) {
    if (fs.statSync(from).isDirectory()) {
      fs.mkdirSync(to, {recursive:true});
      for (const name of fs.readdirSync(from)) publish(path.join(from, name), path.join(to, name));
    } else {
      fs.renameSync(from, to);
    }
  }
  for (const name of fs.readdirSync(staging).filter(name => name !== 'app.js')) {
    publish(path.join(staging, name), path.join('dist/assets', name));
  }
  fs.renameSync(path.join(staging, 'app.js'), 'dist/assets/app.js');
} finally {
  fs.rmSync(staging, {recursive:true, force:true});
}
