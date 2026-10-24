// Transparent, deterministic diagnostics. No hiring prediction or plagiarism verdict.
export const words = text => [...text.matchAll(/[\p{L}\p{N}]+(?:[+#.][\p{L}\p{N}+#]*)?/gu)].map(m=>({text:m[0],key:m[0].toLowerCase().replace(/\.$/,''),start:m.index,end:m.index+m[0].length}));
const stop=new Set('a an the and or of for to in on at by with from as is are was were be been being it its this that these those you your we our they their will would can could should must have has had not about into through using use work working experience required preferred requirements qualifications responsibilities role team strong excellent good ability skills knowledge including such relevant years year minimum plus able seeking looking candidate position company job need least build integrate develop create highly also new based etc within across excellent opportunity join support help successful'.split(' '));
export function compareSources(text,sources,min=5){
  const tokens=words(text),matched=new Set(),matches=[];
  if(tokens.length<min)throw Error(`Enter at least ${min} words to compare.`);
  if(!sources.some(s=>s.text.trim()))throw Error('Add at least one source to compare. No web database is connected.');
  for(const source of sources){const other=words(source.text),index=new Map();for(let j=0;j<=other.length-min;j++){const key=other.slice(j,j+min).map(t=>t.key).join(' ');if(!index.has(key))index.set(key,j)}
    const ranges=[];let i=0;while(i<=tokens.length-min){const key=tokens.slice(i,i+min).map(t=>t.key).join(' '),j=index.get(key);if(j===undefined){i++;continue}let n=min;while(i+n<tokens.length&&j+n<other.length&&tokens[i+n].key===other[j+n].key)n++;ranges.push({start:tokens[i].start,end:tokens[i+n-1].end,sourceStart:other[j].start,sourceEnd:other[j+n-1].end,count:n});for(let k=i;k<i+n;k++)matched.add(k);i+=n}
    if(ranges.length)matches.push({name:source.name,ranges,words:ranges.reduce((n,r)=>n+r.count,0)});
  }
  const ranges=matches.flatMap(m=>m.ranges).sort((a,b)=>a.start-b.start),merged=[];for(const r of ranges){const last=merged.at(-1);if(last&&r.start<=last.end)last.end=Math.max(last.end,r.end);else merged.push({start:r.start,end:r.end})}
  return {percent:Math.round(matched.size/tokens.length*100),matchedWords:matched.size,totalWords:tokens.length,sourceCount:sources.length,matches,ranges:merged};
}
const knownSkills=['api','problem solving','javascript','typescript','python','java','c++','c#','react','node.js','express','angular','vue','next.js','html','css','sql','postgresql','mysql','mongodb','redis','aws','azure','gcp','docker','kubernetes','git','github','rest api','graphql','ci/cd','agile','scrum','figma','excel','power bi','tableau','data analysis','machine learning','deep learning','pytorch','tensorflow','customer service','project management','product management','stakeholder management','communication','leadership','budgeting','financial analysis','sales','marketing','seo','content writing','recruitment','payroll','accounting','research','testing','jest','playwright','accessibility','linux','security','nursing','patient care','inventory','supply chain','operations','quality assurance'];
const aliases={'api':['apis','rest api','rest apis'],'programming':['JavaScript','TypeScript','Python','Java','C++','C#'],'databases':['SQL','PostgreSQL','MySQL','MongoDB'],'react':['react.js','reactjs'],'node.js':['nodejs','node js'],'javascript':['js'],'typescript':['ts'],'rest api':['rest apis','restful api','restful apis'],'rest apis':['rest api','restful api','restful apis'],'aws':['amazon web services'],'gcp':['google cloud','google cloud platform'],'ci/cd':['continuous integration','continuous delivery'],'postgresql':['postgres'],'c#':['c sharp'],'c++':['cpp']};
function hasTerm(text,term){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'iu').test(text)}
export function jobTerms(jd){const found=knownSkills.filter(s=>hasTerm(jd,s)||aliases[s]?.some(a=>hasTerm(jd,a)));const freqs=new Map();for(const w of words(jd)){if(w.key.length<3||stop.has(w.key)||/^\d/.test(w.key)||found.some(s=>s.includes(w.key)))continue;freqs.set(w.key,(freqs.get(w.key)||0)+1)}return [...new Set([...found,...[...freqs].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([s])=>s)])]}
const sectionPatterns={Experience:/^(?:(?:professional|work|employment|relevant)\s+)?(?:experience|employment(?: history)?|work history)\s*: ?$/i,Education:/^(?:education|academic(?: background| qualifications)?|qualifications)\s*:?$/i,Skills:/^(?:(?:technical|core|key|professional)\s+)?(?:skills|competencies|technologies|expertise)\s*:?$/i,Summary:/^(?:(?:professional|career|personal)\s+)?(?:summary|profile|objective|about me)\s*:?$/i,Projects:/^(?:(?:selected|personal|academic)\s+)?projects\s*:?$/i,Certifications:/^(?:certifications?|licenses?(?: and certifications?)?)\s*:?$/i};
// Accept bare headings as well as headings with a colon.
sectionPatterns.Experience=/^(?:(?:professional|work|employment|relevant)\s+)?(?:experience|employment(?: history)?|work history)\s*:?$/i;
const verbs=new Set('achieved accelerated automated built created delivered designed developed drove implemented improved increased launched led managed optimized reduced resolved saved scaled shipped streamlined supported tested trained transformed wrote analyzed coordinated established maintained integrated organized produced researched'.split(' '));
export const actionAlternatives={designed:['Created','Planned','Developed'],developed:['Built','Implemented','Delivered'],managed:['Led','Coordinated','Oversaw'],created:['Produced','Built','Launched'],worked:['Contributed','Delivered','Supported']};
export function analyzeResume(text,jd,meta={}){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),tokens=words(text),issues=[];
 const add=(category,title,evidence,fix,severity='review')=>issues.push({category,title,evidence,fix,severity});
 const sections=Object.entries(sectionPatterns).map(([name,re])=>({name,index:lines.findIndex(l=>re.test(l))}));
 const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
 const phone=[...text.matchAll(/(?:\+?\d[\d ().-]{7,}\d)/g)].map(m=>m[0]).find(s=>s.replace(/\D/g,'').length>=10&&s.replace(/\D/g,'').length<=15&&!/^\d{4}\s*[-–]\s*\d{4}$/.test(s));
 const linkedin=text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s]+/i)?.[0];
 const contact={email,phone,linkedin};
 if(!email)add('Contact','Email address missing','No email address was recognized.','Add a professional email in the main document text.','high');
 if(!phone)add('Contact','Phone number not recognized','No 10–15 digit phone number was recognized.','Add a reachable phone number with country code if appropriate.');
 for(const name of ['Experience','Education','Skills'])if(sections.find(s=>s.name===name).index<0)add('Sections',`${name} heading not found`,'A standard standalone heading was not detected.',`Use a clear “${name}” heading if this section applies to you. Projects can demonstrate experience for a first role.`);
 const bullets=lines.filter(l=>/^[•●▪◦‣\-*–]\s*/.test(l));
 const achievementLines=bullets.length?bullets:lines.filter(l=>verbs.has(words(l)[0]?.key)&&words(l).length>5);
 const quantified=achievementLines.filter(l=>/(?:\d+(?:\.\d+)?\s*%|[$₹€£]\s*\d|\b\d+\s+(?:users|clients|customers|projects|people|hours|days|weeks|months|reports|teams|employees|applications|students|patients|orders|million|thousand)\b|\b(?:by|from|to)\s+\d+)/i.test(l));
 for(const l of achievementLines.filter(l=>!quantified.includes(l)))add('Impact','Show the outcome',l,'Add an accurate result: scale, time saved, quality, revenue, or people helped. Use numbers only if you can substantiate them.');
 if(!achievementLines.length)add('Impact','Achievements are hard to identify','No bullet points or action-led achievement lines were recognized.','Use concise achievement bullets: action + task + verified result.');
 for(const l of achievementLines){const first=words(l)[0]?.key;if(/^(responsible for|duties included|worked on|helped with)/i.test(l.replace(/^[•●▪◦‣\-*–]\s*/,'')))add('Writing','Replace a weak opening',l,'Start with the specific action you took, then state the outcome.');if(words(l).length>40)add('Writing','Long achievement bullet',l,'Split into one clear achievement per bullet.');}
 const openings=new Map();for(const l of achievementLines){const key=words(l)[0]?.key;if(key)openings.set(key,(openings.get(key)||0)+1)}
 const repeated=[...openings].filter(([,n])=>n>=3);for(const [word,n] of repeated)add('Repetition',`“${word}” opens ${n} bullets`,`${n} repeated openings.`, `Vary the action where accurate. Consider ${(actionAlternatives[word]||['Delivered','Improved','Led']).join(', ')}.`);
 const styles=new Set(bullets.map(l=>l[0])),punctuation=bullets.map(l=>/[.!?]$/.test(l));
 if(styles.size>1)add('Consistency','Mixed bullet symbols',[...styles].join(' '),'Use one bullet style throughout.');
 if(punctuation.includes(true)&&punctuation.includes(false))add('Consistency','Inconsistent bullet endings','Some bullets have ending punctuation and others do not.','Choose one punctuation style and use it consistently.');
 const target=roleContext(jd);const terms=jobTerms(target.text),matched=terms.filter(t=>hasTerm(text,t)||aliases[t]?.some(a=>hasTerm(text,a))),missing=terms.filter(t=>!matched.includes(t));
 if(missing.length)add('Job match','Job-description terms not found',missing.join(', '),'Add relevant evidence for skills you actually have. Missing terms are prompts to review, not proof that you lack a qualification.','high');
 const jdYears=[...jd.matchAll(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/gi)].map(m=>m[0]);if(jdYears.length)add('Job match','Check experience requirements',jdYears.join('; '),'Compare these requirements with your actual experience. Overlapping jobs and internships need manual review.');
 const exp=sections.find(s=>s.name==='Experience'),edu=sections.find(s=>s.name==='Education');
 if(exp.index>=0&&edu.index>=0&&edu.index<exp.index)add('Section order','Education appears before experience','Education precedes Experience.','Appropriate for students and recent graduates. For experienced roles, consider putting relevant experience first.','info');
 const badChars=(text.match(/�/g)||[]).length;
 if(badChars)add('Readability','Unrecognized characters',`${badChars} replacement characters found.`,'Re-export with embedded fonts and review the extracted text.','high');
 if(meta.emptyPages?.length)add('Readability','Pages without selectable text',`Pages ${meta.emptyPages.join(', ')}.`,'Run OCR or use a text-based PDF/DOCX before applying.','high');
 if(meta.ocrPages?.length)add('Readability','Original PDF contains scanned pages',`Pages ${meta.ocrPages.join(', ')} were recognized with OCR.`,'Review recognition errors and export a searchable PDF or DOCX before applying. An employer may not be able to read the original scanned file.','high');
 if(meta.columns)add('Readability','Possible multiple-column layout','Text appears in separate columns.','Check the extracted reading order below. Consider a single-column version if it is scrambled.');
 if(tokens.length<150)add('Length','Limited resume detail',`${tokens.length} words extracted.`,'Check for missing text; include relevant evidence rather than padding.');
 if(tokens.length>1000)add('Length','Consider a more focused resume',`${tokens.length} words extracted.`,'Prioritize experience that supports this job. Longer academic CVs can be appropriate.');
 for(const m of text.matchAll(/\b(\w+)\s+\1\b/gi))add('Writing','Repeated adjacent word',m[0],'Remove the duplicate if it is accidental.');
 const core=sections.filter(s=>['Experience','Education','Skills'].includes(s.name));
 const scores={match:terms.length?Math.round(matched.length/terms.length*100):null,sections:Math.round(core.filter(s=>s.index>=0).length/3*100),contact:Math.round((Number(!!email)+Number(!!phone))/2*100),impact:achievementLines.length?Math.round(quantified.length/achievementLines.length*100):0,readability:Math.max(0,100-(badChars?25:0)-(meta.emptyPages?.length?60:0)-(meta.columns?15:0)-(meta.ocrPages?.length?45:0)-(tokens.length<50?50:0)),writing:Math.max(0,100-issues.filter(i=>['Writing','Repetition','Consistency'].includes(i.category)).length*12)};
 const weights={match:35,sections:15,contact:10,impact:15,readability:15,writing:10};
 const available=Object.keys(scores).filter(k=>scores[k]!==null),score=Math.round(available.reduce((n,k)=>n+scores[k]*weights[k],0)/available.reduce((n,k)=>n+weights[k],0));
 return {score,targetNote:target.note,scores,weights,issues,sections,contact,terms,matched,missing,repeated,wordCount:tokens.length,bulletCount:achievementLines.length,quantified:quantified.length,extractedText:text};
}
export function smoothText(text){
 const rules=[[/\bin order to\b/gi,'to'],[/\bdue to the fact that\b/gi,'because'],[/\bat this point in time\b/gi,'now'],[/\bit is important to note that\s*/gi,''],[/\bin the event that\b/gi,'if'],[/\bfor the purpose of\b/gi,'for'],[/\butilize\b/gi,'use'],[/\butilized\b/gi,'used'],[/\butilizing\b/gi,'using'],[/\ba large number of\b/gi,'many'],[/\bon a daily basis\b/gi,'daily'],[/\bprior to\b/gi,'before'],[/\bsubsequent to\b/gi,'after'],[/\bin close proximity to\b/gi,'near'],[/\bhas the ability to\b/gi,'can'],[/\bin spite of the fact that\b/gi,'although']];
 let output=text,changes=[];for(const [re,replacement]of rules){const matches=[...output.matchAll(re)];if(matches.length){changes.push({from:matches[0][0],to:replacement||'(removed)',count:matches.length});output=output.replace(re,(m)=>/^[A-Z]/.test(m)&&replacement?replacement[0].toUpperCase()+replacement.slice(1):replacement)}}
 output=output.replace(/[ \t]+([,.;!?])/g,'$1').replace(/([.!?]\s+|^)([a-z])/g,(_,a,b)=>a+b.toUpperCase());
 return {text:output,changes};
}

export function roleContext(jd){
 if(words(jd).length>4)return {text:jd,note:'Matched against your supplied job description.'};
 const profiles=[[/front.?end|react/i,'JavaScript TypeScript React HTML CSS accessibility testing Git REST API'],[/back.?end/i,'API SQL databases testing Git security'],[/developer|software|programmer/i,'programming testing Git SQL API problem solving'],[/data analyst/i,'SQL Excel data analysis visualization statistics communication'],[/data scien|machine learning/i,'Python SQL machine learning statistics data analysis'],[/design|ux|ui/i,'Figma research design accessibility communication'],[/market|seo/i,'marketing content writing SEO analytics communication'],[/sales/i,'sales customer service communication negotiation'],[/account|finance/i,'accounting Excel financial analysis budgeting'],[/teacher|educator/i,'teaching lesson planning assessment classroom communication'],[/nurs/i,'nursing patient care communication documentation'],[/project manager/i,'project management budgeting stakeholder management communication'],[/hr|recruit/i,'recruitment communication payroll'],[/support|customer service/i,'customer service communication problem solving']];
 const profile=profiles.find(([re])=>re.test(jd));
 return profile?{text:profile[1],note:`General skill suggestions for “${jd}”. These are an editable starting point, not requirements from an employer.`}:{text:jd,note:`Matching only the short target “${jd}”. Add skills or a full description for a more useful match.`};
}
export function writingReview(text){
 const tokens=words(text);if(tokens.length<5)throw Error('Enter at least 5 words or upload a readable file.');
 const sentences=text.match(/[^.!?\n]+[.!?]?/g)?.filter(s=>s.trim())||[],issues=[];
 for(const m of text.matchAll(/\b(\w+)\s+\1\b/gi))issues.push({title:'Repeated word',evidence:m[0],fix:'Remove the duplicate if it is accidental.'});
 for(const s of sentences)if(words(s).length>30)issues.push({title:'Long sentence',evidence:s.trim(),fix:'Split this into shorter sentences, keeping the original meaning.'});
 for(const change of smoothText(text).changes)issues.push({title:'Wordy phrase',evidence:change.from,fix:`Consider ${change.to}.`});
 for(const m of text.matchAll(/\s+[,.;!?]|[,;](?=[A-Za-z])/g))issues.push({title:'Punctuation spacing',evidence:m[0],fix:'Remove spaces before punctuation and add a space after commas or semicolons.'});
 const average=sentences.length?tokens.length/sentences.length:tokens.length;
 const score=Math.max(0,100-Math.min(70,issues.length*7)-Math.max(0,Math.round(average-25)));
 return {score,issues,words:tokens.length,sentences:sentences.length,average:Math.round(average),note:'Writing clarity score from sentence length, repeated words, wordiness and punctuation. It is not a plagiarism or AI-detection score.'};
}
