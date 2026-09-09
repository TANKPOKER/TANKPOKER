// Régénère tests/core18.js et tests/engine.js depuis index.html.
// À relancer après toute modification du <script> de index.html.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .split('<script>')[1].split('</'+'script>')[0];
let core=js.split('/* ============================================================\n   4. INTERFACE')[0];
core=core.replace(/\(async\(\)=>\{[\s\S]*?\}\)\(\);/,'')
  .replace(/function loadSupabase[\s\S]*?\n\}/,'')
  .replace(/async function cloudLoad[\s\S]*?\n\}/,'');
const parts=['const PCT=[\\s\\S]*?(?=\\nfunction sizingsHTML)','function wheelValue[\\s\\S]*?\\n\\}',
 'function autoTags[\\s\\S]*?\\n\\}','function myEvents[\\s\\S]*?\\n\\}',
 'const HASH_OF=[\\s\\S]*?function urlFor[\\s\\S]*?\\n\\}',
 'function reactedHands[\\s\\S]*?\\n\\}','function commentedHands[\\s\\S]*?\\n\\}'];
const ex=parts.map(rx=>js.match(new RegExp(rx))[0]).join('\n');
fs.writeFileSync(path.join(root,'tests/core18.js'),core+'\n'+ex
 +'\nmodule.exports={newHand,apply,pot,legal,sidePots,openStreet,toCall,activeSeats,canSkipTo,skipCore,wilson,controversy,hotScore,ranked,DB,MY,STAKES,FORMAT_LABEL,autoTitle,autoTags,myEvents,urlFor,store,reactedHands,commentedHands,wheelValue,WINDOWS,NOW,SEAT_ORDER,STREETS,NEED,round2,PCT,sizingOptions};');
const eng=js.split('/* ============================================================\n   2. CLASSEMENTS')[0];
fs.writeFileSync(path.join(root,'tests/engine.js'),eng
 +'\nmodule.exports={newHand,apply,pot,legal,sidePots,openStreet,toCall,activeSeats,canActCount,canSkipTo,skipCore,STREETS};');
console.log('tests/core18.js et tests/engine.js régénérés');
