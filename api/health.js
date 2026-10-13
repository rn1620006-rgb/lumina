'use strict';
module.exports = function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método não permitido.'});
  return res.status(200).json({ok:true,submissionsEnabled:Boolean((process.env.DATABASE_URL||process.env.POSTGRES_URL) && process.env.LUMINA_SIGNUPS_ENABLED==='true'),version:'0.2.0'});
};
