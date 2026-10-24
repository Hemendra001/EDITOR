export function reviewRewrite(original,output){
 const numbers=s=>[...s.matchAll(/\b\d+(?:[.,]\d+)*%?/g)].map(m=>m[0]).sort().join('|');
 const relations=s=>[...s.matchAll(/\b(by|to|from|over|under|at least|at most|more than|less than)\s+(\d+(?:[.,]\d+)*%?)/gi)].map(m=>m[1].toLowerCase()+' '+m[2]).sort().join('|');
 const negative=s=>/\b(?:not|never|no|without|cannot)\b|n['’]t\b/i.test(s);
 const count=s=>(s.match(/\S+/g)||[]).length;
 if(numbers(original)!==numbers(output))return {text:original,reason:'Original retained: the AI changed numbers.'};
 if(relations(original)!==relations(output))return {text:original,reason:'Original retained: the AI changed a numerical relationship.'};
 if(negative(original)!==negative(output))return {text:original,reason:'Original retained: the AI may have changed a negation.'};
 if(count(output)<count(original)*.55||count(output)>count(original)*1.8)return {text:original,reason:'Original retained: the AI omitted or added too much text.'};
 return {text:output,reason:null};
}
