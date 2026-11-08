// DIBUAT OTOMATIS oleh scripts/export_engine.js dari www/index.html — jangan diedit manual.
// Mesin fisika PinPaw (sama persis dengan game) + solver: menghitung jumlah urutan menang/kalah dan langkah minimum.
'use strict';
var cells,pins,state,anim,ev,why,fxq=[],mv=[],SEEN=null,shieldOn=false,sim=true,needRebuild=false,deadAt=null;
function fx(){} function toast(){}
function mk(e){var P={move:1,hiss:2,break:2,warp:2,gate:2.2,boom:2.5,lose:3,win:4};if(!ev||P[e]>P[ev])ev=e;}
function moreCats(r,c){for(var y=0;y<cells.length;y++)for(var x=0;x<cells[y].length;x++)if(cells[y][x]==='H'&&(y!==r||x!==c))return true;return false;}
function act(ch,r,c,tr,tc){
  var t=cells[tr][tc],d=tr>r?'dn':(tr<r?'up':(tc>c?'rt':'lf')),k=tr+','+tc;
  // benda berat / api yang jatuh atau menggelinding ke balon -> balon pecah (bendanya lanjut jatuh di tick berikutnya)
  if(t==='A'&&'LRDE'.indexOf(ch)>=0){cells[tr][tc]='.';anim[k]='pf';mk('break');fx('break',tr,tc);mv.push({ch:'A',r:tr,c:tc,tr:tr,tc:tc,t:'pop'});return 1;}
  if(t==='O'){
    var po=portalExit(tr,tc);if(!po||cells[po[0]][po[1]]==='O') return 0;
    var res=act(ch,r,c,po[0],po[1]);
    if(res){fx('warp',tr,tc);fx('warp',po[0],po[1]);mk('warp');if(SEEN)SEEN[po[0]+','+po[1]]=1;}
    return res;
  }
  if((ch==='X'&&t==='L')||(ch==='L'&&t==='X')||(ch==='R'&&t==='X')){
    cells[r][c]='.';cells[tr][tc]='.';mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'boom'});explode(tr,tc);return 1;
  }
  if((ch==='W'&&t==='X')||(ch==='X'&&t==='W')){cells[tr][tc]='.';cells[r][c]='.';anim[k]='pf';mk('hiss');fx('steam',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'steam'});return 1;}
  if(ch==='L'&&t==='I'){cells[tr][tc]='W';cells[r][c]='.';anim[k]='pf';mk('hiss');fx('steam',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'melt'});return 1;}
  if(t==='.'){cells[tr][tc]=ch;cells[r][c]='.';anim[k]=d;mk('move');mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'move'});return 1;}
  if(ch==='H'&&t==='F'&&moreCats(r,c)){cells[tr][tc]='K';cells[r][c]='.';anim[k]=d;mk('warp');fx('confetti',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'fed'});return 1;}
  if(ch==='H'&&t==='F'){cells[tr][tc]='H';cells[r][c]='.';anim[k]=d;state='win';mk('win');fx('confetti',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'win'});return 1;}
  if((ch==='W'&&t==='L')||(ch==='L'&&t==='W')){cells[tr][tc]='.';cells[r][c]='.';anim[k]='pf';mk('hiss');fx('steam',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'steam'});return 1;}
  if(shieldOn&&!sim&&((ch==='H'&&t==='L')||(ch==='L'&&t==='H'))){
    shieldOn=false;needRebuild=true;if(ch==='H'){cells[tr][tc]='H';cells[r][c]='.';anim[k]=d;}else cells[r][c]='.';
    mk('hiss');fx('steam',tr,tc);try{toast('🛡️ Perisai memadamkan api!');}catch(e){}return 1;
  }
  if(shieldOn&&!sim&&(ch==='R'||ch==='D'||ch==='E')&&t==='H'){shieldOn=false;needRebuild=true;cells[r][c]='.';mk('break');fx('break',tr,tc);try{toast('🛡️ Perisai menahan batu!');}catch(e){}return 1;}
  if((ch==='H'&&t==='L')||(ch==='L'&&(t==='H'||t==='F'))){
    why=(ch==='L'&&t==='F')?'Ikannya hangus!':'Kucing terbakar!';if(!sim)deadAt={t:ch==='H'?'H':t,p:[tr,tc]};
    cells[tr][tc]='L';cells[r][c]='.';state='lose';mk('lose');fx('burn',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'burn'});return 1;
  }
  if((ch==='D'||ch==='E')&&(t==='H'||t==='F')&&!(shieldOn&&!sim&&t==='H')){why=t==='H'?'Kucing tertabrak tong!':'Ikannya tertabrak tong!';if(!sim)deadAt={t:t,p:[tr,tc]};cells[tr][tc]=ch;cells[r][c]='.';state='lose';mk('lose');fx('crush',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'crush'});return 1;}
  if(((ch==='D'||ch==='E')&&t==='L')||(ch==='L'&&(t==='D'||t==='E'))){cells[tr][tc]='.';cells[r][c]='.';anim[k]='pf';mk('hiss');fx('steam',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'steam'});return 1;}
  if((ch==='D'||ch==='E')&&t==='B'){cells[tr][tc]='.';cells[r][c]='.';anim[k]='pf';mk('break');fx('break',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'break'});return 1;}
  if(ch==='R'&&t==='B'){cells[tr][tc]='.';cells[r][c]='.';anim[k]='pf';mk('break');fx('break',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'break'});return 1;}
  if(ch==='R'&&(t==='H'||t==='F')){why=t==='H'?'Kucing tertimpa batu!':'Ikannya tertimpa batu!';if(!sim)deadAt={t:t,p:[tr,tc]};cells[tr][tc]='R';cells[r][c]='.';state='lose';mk('lose');fx('crush',tr,tc);mv.push({ch:ch,r:r,c:c,tr:tr,tc:tc,t:'crush'});return 1;}
  return 0;
}
function portalExit(tr,tc){
  var o=null,n=0;
  for(var r=0;r<cells.length;r++)for(var c=0;c<cells[r].length;c++)if(cells[r][c]==='O'){n++;if(r!==tr||c!==tc)o=[r,c];}
  if(n!==2||!o||o[0]+1>=cells.length) return null;
  return [o[0]+1,o[1]];
}
function explode(cr,cc){
  var hurt='';
  for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){
    var rr=cr+dr,c2=cc+dc;if(rr<0||rr>=cells.length||c2<0||c2>=cells[0].length) continue;
    var x=cells[rr][c2];
    if(x==='H'||x==='F'){if(!hurt||x==='H')hurt=x;continue;}
    if('BRILWXDEA'.indexOf(x)>=0)cells[rr][c2]='.';
  }
  fx('boom',cr,cc);mk('boom');
  if(hurt){why=hurt==='H'?'Kucing kena ledakan petasan!':'Ikannya kena ledakan petasan!';state='lose';mk('lose');}
}
function tick(){
  var moved=false,seen={};SEEN=seen;
  for(var r=cells.length-1;r>=0;r--){
    for(var c=0;c<cells[r].length;c++){
      var ch=cells[r][c];
      if(ch==='A'){if(!pins.has(r+','+c)&&!seen[r+','+c]&&rise(r,c)){moved=true;if(state!=='play')return true;}continue;}
      if('HLWRXDE'.indexOf(ch)<0||pins.has(r+','+c)||seen[r+','+c]) continue;
      var ok=0;
      if(r+1<cells.length) ok=act(ch,r,c,r+1,c);
      if(!ok&&r+1<cells.length){
        var b=cells[r+1][c];
        if(b==='>'||b==='<'){var nc=c+(b==='>'?1:-1);
          if(nc>=0&&nc<cells[r].length){ok=act(ch,r,c,r,nc);if(ok)seen[r+','+nc]=1;}}
      }
      if(!ok&&(ch==='D'||ch==='E')&&state==='play'){var rc2=c+(ch==='D'?1:-1);
        if(rc2>=0&&rc2<cells[r].length){ok=act(ch,r,c,r,rc2);if(ok)seen[r+','+rc2]=1;}}
      if(state!=='play') return true;
      if(ok) moved=true;
    }
  }
  if(openGates())moved=true;
  if(!moved&&state==='play'&&blow())moved=true;
  return moved;
}
function openGates(){
  var press=false,gs=[];
  for(var r=0;r<cells.length;r++)for(var c=0;c<cells[r].length;c++){
    var x=cells[r][c];
    if(x==='Z')gs.push([r,c]);
    else if(x==='Q'&&r>0&&'HLWRXDE'.indexOf(cells[r-1][c])>=0&&!pins.has((r-1)+','+c))press=true;
  }
  if(!press||!gs.length) return false;
  gs.forEach(function(g){cells[g[0]][g[1]]='.';anim[g[0]+','+g[1]]='pf';fx('warp',g[0],g[1]);});
  mk('gate');return true;
}
function rise(r,c){
  if(r<1) return 0;
  var t=cells[r-1][c],k1=(r-1)+',';
  if(t==='.'){cells[r-1][c]='A';cells[r][c]='.';anim[k1+c]='up';SEEN[k1+c]=1;mk('move');mv.push({ch:'A',r:r,c:c,tr:r-1,tc:c,t:'move'});return 1;}
  if(t==='L'){cells[r][c]='.';anim[r+','+c]='pf';mk('break');fx('break',r,c);mv.push({ch:'A',r:r,c:c,tr:r,tc:c,t:'pop'});return 1;}
  if('HWX'.indexOf(t)<0||pins.has(k1+c)||r<2) return 0;
  var u=cells[r-2][c],k2=(r-2)+','+c,lift=function(){cells[r-1][c]='A';cells[r][c]='.';anim[k1+c]='up';SEEN[k1+c]=1;mv.push({ch:'A',r:r,c:c,tr:r-1,tc:c,t:'move'});};
  if(u==='.'){cells[r-2][c]=t;anim[k2]='up';SEEN[k2]=1;mv.push({ch:t,r:r-1,c:c,tr:r-2,tc:c,t:'move'});lift();mk('move');return 1;}
  if(t==='H'&&u==='F'){var more=moreCats(r-1,c);cells[r-2][c]=more?'K':'H';anim[k2]='up';SEEN[k2]=1;mv.push({ch:'H',r:r-1,c:c,tr:r-2,tc:c,t:more?'fed':'win'});lift();fx('confetti',r-2,c);
    if(more)mk('warp');else{state='win';mk('win');}return 1;}
  if(t==='H'&&u==='L'){why='Kucing terbakar!';if(!sim)deadAt={t:'H',p:[r-2,c]};cells[r-1][c]='.';state='lose';mk('lose');fx('burn',r-2,c);mv.push({ch:'H',r:r-1,c:c,tr:r-2,tc:c,t:'burn'});return 1;}
  if(t==='W'&&(u==='L'||u==='X')){cells[r-2][c]='.';anim[k2]='pf';mk('hiss');fx('steam',r-2,c);mv.push({ch:'W',r:r-1,c:c,tr:r-2,tc:c,t:'steam'});lift();return 1;}
  if(t==='X'&&u==='L'){cells[r-1][c]='.';cells[r-2][c]='.';mv.push({ch:'X',r:r-1,c:c,tr:r-2,tc:c,t:'boom'});explode(r-2,c);return 1;}
  return 0;
}
function blow(){
  var push={},ks=[],moved=false;
  for(var r=0;r<cells.length;r++)for(var c=0;c<cells[r].length;c++){
    var f=cells[r][c];if(f!=='N'&&f!=='G')continue;
    var d=f==='N'?1:-1,x=c+d;while(x>=0&&x<cells[r].length&&cells[r][x]==='.')x+=d;
    if(x<0||x>=cells[r].length||'HWXA'.indexOf(cells[r][x])<0||pins.has(r+','+x))continue;
    var k=r+','+x;if(!(k in push)){push[k]=0;ks.push(k);}push[k]+=d;
  }
  for(var i=0;i<ks.length;i++){
    var d2=push[ks[i]];if(!d2)continue;
    var p=ks[i].split(','),r2=+p[0],x2=+p[1],tx=x2+(d2>0?1:-1),ch=cells[r2][x2];
    if(tx<0||tx>=cells[r2].length||'HWXA'.indexOf(ch)<0)continue;
    var ok=0;
    if(ch==='A'&&'LRDE'.indexOf(cells[r2][tx])>=0){cells[r2][x2]='.';anim[ks[i]]='pf';mk('break');fx('break',r2,x2);mv.push({ch:'A',r:r2,c:x2,tr:r2,tc:x2,t:'pop'});ok=1;}
    else ok=act(ch,r2,x2,r2,tx);
    if(ok){moved=true;if(SEEN)SEEN[r2+','+tx]=1;if(state!=='play')return true;}
  }
  return moved;
}
function stable(g,ps){cells=g.map(function(r){return r.split('');});pins=new Set(ps.map(function(p){return p.join();}));state='play';anim={};mv=[];return !tick()&&state==='play';}
function solve(g,ps,lk,cap){
  var memo={},steps=0,hit=false;
  function f(c0,p0){
    var key=c0.map(function(r){return r.join('');}).join('|')+'#'+Array.from(p0).sort().join(';');
    if(memo[key])return memo[key];
    var w=0,l=0,mw=1e9;
    for(var p of p0){
      if(lk[p]&&p0.has(lk[p]))continue;
      if(++steps>cap){hit=true;break;}
      cells=c0.map(function(r){return r.slice();});pins=new Set(p0);pins.delete(p);state='play';anim={};mv=[];fxq=[];
      var t=0;while(t++<80){var m=tick();if(state!=='play'||!m)break;}
      if(state==='win'){w++;mw=Math.min(mw,1);}
      else if(state==='lose')l++;
      else if(pins.size){var s=f(cells.map(function(r){return r.slice();}),new Set(pins));w+=s.w;l+=s.l;mw=Math.min(mw,1+s.mw);}
      else l++;
    }
    return memo[key]={w:w,l:l,mw:mw};
  }
  var r=f(g.map(function(x){return x.split('');}),new Set(ps.map(function(p){return p.join();})));
  return {w:r.w,l:r.l,par:r.mw,cap:hit};
}
function lkOf(L){var o={};(L.k||[]).forEach(function(a){o[a[0]+','+a[1]]=a[2]+','+a[3];});return o;}
module.exports={solve:solve,stable:stable,lkOf:lkOf};
