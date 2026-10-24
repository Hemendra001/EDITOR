import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
// No credentials, git history, dependencies, caches, or private example files.
const root=process.cwd(),output=path.join(root,'deliverables','I-Hate-PDF-Website.zip');
fs.mkdirSync(path.dirname(output),{recursive:true});
const python=`import pathlib,zipfile,re,sys\nroot=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2])\nwith zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:\n for folder in ['src','scripts','tests','dist']:\n  for p in (root/folder).rglob('*'):\n   if not p.is_file() or re.search(r' 2(?:\\.|$)',p.name) or '.DS_Store' in str(p) or p.suffix=='.part': continue\n   if 'flan-t5-base' in str(p): continue\n   z.write(p, 'I-Hate-PDF/'+str(p.relative_to(root)))\n for name in ['package.json','package-lock.json','README.md','START-HERE.txt','start-website.py']:\n  z.write(root/name,'I-Hate-PDF/'+name)\nprint(str(out))\n`;
const result=spawnSync('python3',['-c',python,root,output],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
console.log(`Portable website: ${(fs.statSync(output).size/1024/1024).toFixed(1)} MB`);
