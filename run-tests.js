// Lance les 22 suites depuis tests/, échoue si une seule échoue.
const {execSync}=require('child_process');
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','tests');
const suites=fs.readdirSync(dir).filter(f=>/^test-.*\.js$/.test(f)).sort();
let total=0,bad=0;
for(const f of suites){
  try{
    const out=execSync('node '+f,{cwd:dir,encoding:'utf8'});
    const last=out.trim().split('\n').pop();
    const n=parseInt(last)||0; total+=n;
    console.log(f.padEnd(18),last);
  }catch(e){ bad++; console.log(f.padEnd(18),'ÉCHEC'); console.log((e.stdout||'').split('\n').filter(l=>l.includes('FAIL')).join('\n')); }
}
console.log('\nTOTAL:',total,'tests verts,',suites.length,'suites'+(bad?', '+bad+' suite(s) en échec':''));
process.exit(bad?1:0);
