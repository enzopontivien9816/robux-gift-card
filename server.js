const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'codes.json');

app.use(express.json({limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public')));
fs.mkdirSync(DATA_DIR,{recursive:true});
if (!fs.existsSync(DATA_FILE)) {
  const demoCards = [400,800,1700,4500,10000].map(amount => ({
    id: crypto.randomUUID(), amount, code: 'DEMO-NON-REDEEMABLE-' + amount,
    used: false, demo: true, createdAt: new Date().toISOString()
  }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(demoCards, null, 2));
}

function readCodes(){ try{return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}catch{return [];} }
function saveCodes(codes){fs.writeFileSync(DATA_FILE,JSON.stringify(codes,null,2));}
function admin(req,res,next){
  const supplied=req.get('x-admin-password') || '';
  if(!ADMIN_PASSWORD){return res.status(503).json({error:'Panel créateur non configuré. Ajoute ADMIN_PASSWORD dans les variables Render.'});}
  const a=Buffer.from(supplied), b=Buffer.from(ADMIN_PASSWORD);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({error:'Mot de passe incorrect.'});
  next();
}
const amounts=[400,800,1700,4500,10000];
app.get('/api/cards',(req,res)=>{
 const codes=readCodes();
 res.json(amounts.map(amount=>({amount,available:codes.filter(c=>c.amount===amount && !c.used && !c.demo).length, demoPreview:codes.some(c=>c.amount===amount && c.demo && !c.used)})));
});
app.post('/api/claim',(req,res)=>{
 const username=String(req.body.username||'').trim();
 const amount=Number(req.body.amount);
 if(username.length<3 || username.length>20 || !/^[A-Za-z0-9_]+$/.test(username)) return res.status(400).json({error:'Entre un pseudo Roblox valide (3 à 20 caractères).'});
 if(!amounts.includes(amount)) return res.status(400).json({error:'Montant invalide.'});
 const codes=readCodes();
 const item=codes.find(c=>c.amount===amount && !c.used && !c.demo);
 if(!item) return res.status(404).json({error:'Aucune carte disponible pour ce montant pour le moment.'});
 item.used=true; item.claimedBy=username; item.claimedAt=new Date().toISOString(); saveCodes(codes);
 res.json({message:'Carte attribuée. Utilise le code sur le site officiel Roblox.',code:item.code,redeemUrl:'https://www.roblox.com/redeem'});
});
app.post('/api/admin/login',(req,res)=>{
 const supplied=String(req.body.password||'');
 if(!ADMIN_PASSWORD) return res.status(503).json({error:'Configure ADMIN_PASSWORD dans Render.'});
 const a=Buffer.from(supplied),b=Buffer.from(ADMIN_PASSWORD);
 if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({error:'Mot de passe incorrect.'});
 res.json({token:crypto.createHmac('sha256',ADMIN_PASSWORD).update('robux-gift-card-admin').digest('hex')});
});
function tokenOk(req){
 const token=String(req.get('x-admin-token')||'');
 const expected=ADMIN_PASSWORD?crypto.createHmac('sha256',ADMIN_PASSWORD).update('robux-gift-card-admin').digest('hex'):'';
 return token.length===expected.length && !!expected && crypto.timingSafeEqual(Buffer.from(token),Buffer.from(expected));
}
app.use('/api/admin', (req,res,next)=> tokenOk(req)?next():res.status(401).json({error:'Connexion créateur requise.'}));
app.get('/api/admin/codes',(req,res)=>res.json(readCodes().map(({id,amount,used,demo:!!c.demo,claimedBy,claimedAt})=>({id,amount,used,claimedBy,claimedAt}))));
app.post('/api/admin/codes',(req,res)=>{
 const amount=Number(req.body.amount), code=String(req.body.code||'').trim();
 if(!amounts.includes(amount)) return res.status(400).json({error:'Montant invalide.'});
 if(code.length<6 || code.length>100) return res.status(400).json({error:'Code invalide.'});
 const codes=readCodes();
 if(codes.some(c=>c.code===code)) return res.status(409).json({error:'Ce code existe déjà.'});
 codes.push({id:crypto.randomUUID(),amount,code,used:false,demo:false,createdAt:new Date().toISOString()});
 saveCodes(codes); res.json({message:'Code ajouté au stock.'});
});
app.delete('/api/admin/codes/:id',(req,res)=>{
 const codes=readCodes(), next=codes.filter(c=>c.id!==req.params.id);
 if(next.length===codes.length) return res.status(404).json({error:'Code introuvable.'});
 saveCodes(next); res.json({message:'Code supprimé.'});
});
app.get('/health',(req,res)=>res.json({ok:true}));
app.listen(PORT,'0.0.0.0',()=>console.log('Robux Gift Card démarré sur '+PORT));
