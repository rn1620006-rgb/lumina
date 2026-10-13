'use strict';
function str(value) { return typeof value === 'string' ? value.trim() : ''; }
function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {ok:false,error:'Pedido inválido.'};
  if (str(input.website)) return {ok:false,error:'Pedido inválido.'};
  const kind=str(input.kind), fullName=str(input.fullName).replace(/\s+/g,' '),
    email=str(input.email).toLowerCase(),city=str(input.city).replace(/\s+/g,' '),
    category=str(input.category),message=str(input.message);
  if (!['cliente','profissional'].includes(kind)) return {ok:false,error:'Escolhe cliente ou profissional.'};
  if (fullName.length<2 || fullName.length>120) return {ok:false,error:'Indica um nome entre 2 e 120 caracteres.'};
  if (email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return {ok:false,error:'Indica um email válido.'};
  if (city.length<2 || city.length>80) return {ok:false,error:'Indica uma localidade válida.'};
  if (category.length>100 || message.length>750) return {ok:false,error:'A descrição é demasiado extensa.'};
  if (input.privacyConsent !== true) return {ok:false,error:'É necessário aceitar a política de privacidade.'};
  return {ok:true,data:{kind,fullName,email,city,category:category||null,message:message||null}};
}
module.exports={validate};
