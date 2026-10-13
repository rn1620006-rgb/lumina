'use strict';
const crypto=require('node:crypto');
const {Pool}=require('pg');
const {validate}=require('../lib/lead-validation');
let pool;
const limit=5;
const connectionUrl=process.env.DATABASE_URL||process.env.POSTGRES_URL;
function db(){
  if(!pool) pool=new Pool({connectionString:connectionUrl,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:6000,idleTimeoutMillis:12000});
  return pool;
}
function finish(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data);}
module.exports=async function handler(req,res){
  res.setHeader('Allow','POST');
  if(req.method!=='POST') return finish(res,405,{ok:false,error:'Método não permitido.'});
  if(!connectionUrl || process.env.LUMINA_SIGNUPS_ENABLED!=='true') return finish(res,503,{ok:false,error:'As pré-inscrições ainda não estão abertas.'});
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(!origin || !host || !/^https?:\/\//.test(origin)) return finish(res,403,{ok:false,error:'Origem não autorizada.'});
  let originHost;
  try {originHost=new URL(origin).host;} catch {return finish(res,403,{ok:false,error:'Origem não autorizada.'});}
  if(originHost!==host) return finish(res,403,{ok:false,error:'Origem não autorizada.'});
  const rawLength=Number(req.headers['content-length']||0);
  if(rawLength>10000) return finish(res,413,{ok:false,error:'Pedido demasiado grande.'});
  let payload=req.body;
  try {if(typeof payload==='string')payload=JSON.parse(payload);} catch {return finish(res,400,{ok:false,error:'Dados inválidos.'});}
  if(JSON.stringify(payload??{}).length>10000) return finish(res,413,{ok:false,error:'Pedido demasiado grande.'});
  // O campo oculto é um honeypot; bots recebem resposta neutra.
  if(payload && typeof payload.website==='string' && payload.website.trim()) return finish(res,200,{ok:true,message:'Obrigado pelo interesse.'});
  const v=validate(payload);
  if(!v.ok) return finish(res,400,{ok:false,error:v.error});
  const source=(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown');
  const ip=String(Array.isArray(source)?source[0]:source).split(',')[0].slice(0,100);
  const ipHash=crypto.createHmac('sha256',process.env.RATE_LIMIT_SECRET||connectionUrl).update(ip).digest('hex');
  let client;
  try{
    client=await db().connect();
    await client.query('BEGIN');
    const counter=await client.query(
      'INSERT INTO lumina_early_access_attempts (ip_hash,request_day,request_count) VALUES ($1,CURRENT_DATE,1) ON CONFLICT (ip_hash,request_day) DO UPDATE SET request_count=lumina_early_access_attempts.request_count+1 RETURNING request_count',
      [ipHash]
    );
    if(counter.rows[0].request_count>limit){
      await client.query('COMMIT');
      return finish(res,429,{ok:false,error:'Demasiadas tentativas. Experimenta amanhã.'});
    }
    await client.query(
      'INSERT INTO lumina_early_access(kind,full_name,email,city,category,message,privacy_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,now()) ON CONFLICT DO NOTHING',
      [v.data.kind,v.data.fullName,v.data.email,v.data.city,v.data.category,v.data.message]
    );
    await client.query('COMMIT');
    return finish(res,200,{ok:true,message:'Obrigado! Recebemos a tua manifestação de interesse.'});
  }catch(e){
    if(client)try{await client.query('ROLLBACK');}catch{}
    console.error('LUMINA interest submission unavailable:',e?.code||'database_error');
    return finish(res,503,{ok:false,error:'Não foi possível guardar agora. Experimenta novamente mais tarde.'});
  }finally{if(client)client.release();}
};
