
// ===== 멀티 광고 네트워크 설정: 가입한 회사의 ID만 채우면 해당 위치에 자동 게재 =====
// 위치 분리 원칙(정책 충돌 방지): 상단=애드센스 / 중단=애드핏(없으면 애드센스) / 하단=데이블·쿠팡(없으면 애드센스)
const NET = {
  adsense: "pub-3867118796714043",      // Google AdSense ca-pub 번호
  adfitTop: "", adfitMid: "", adfitBottom: "", // Kakao AdFit 광고단위 ID (DAN-...)
  dableWidget: "",                       // Dable 위젯 ID
  coupangId: "", coupangTracking: "",     // Coupang Partners ID / 추적코드
  adsterra728: "",   // Adsterra 728x90 일시 중지 2026-10-24: 도박 광고(MELBET) 노출 확인 - 카테고리 차단 방법 확보 전까지 비활성
  adsterraNative: "" // Adsterra Native 일시 중지 2026-10-24: 도박 광고 회전 확인 - 카테고리 차단 방법 확보 전까지 비활성
};
function loadScript(src){const s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s);return s;}
function fillAdsense(el){
  el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-'+NET.adsense+'" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>';
  (window.adsbygoogle=window.adsbygoogle||[]).push({});
}
function fillAdsterra728(el){
  const o=document.createElement('script');
  o.text="atOptions = { 'key' : '"+NET.adsterra728+"', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };";
  el.appendChild(o);
  const s=document.createElement('script');
  s.src='https://bauval.org/22/'+NET.adsterra728;
  el.appendChild(s);
}
function fillAdsterraNative(el){
  const s=document.createElement('script');
  s.async=true; s.setAttribute('data-cfasync','false');
  s.src='https://bauval.org/21/'+NET.adsterraNative;
  el.appendChild(s);
  const d=document.createElement('div');
  d.id='container-'+NET.adsterraNative;
  el.appendChild(d);
}
// 빈 광고 슬롯 접힘: 광고 미충전(애드센스 심사·노필 등) 시 280px 공백 방지.
// MutationObserver 로 지연 충전 시 다시 보이고, 충전 실패 확정 시 숨긴다 (어느 쪽도 영구 고정 아님).
function evaluateAdSlot(el){
  const ins=el.querySelector('ins.adsbygoogle');
  if(ins){
    const st=ins.getAttribute('data-ad-status');
    if(st==='unfilled'){ el.style.display='none'; return; } // 노필 확정 (빈 aswift iframe 은 광고 아님)
    if(st==='filled'){ el.style.display=''; return; }     // 충전 확정
    if(ins.getAttribute('data-adsbygoogle-status')==='done'){
      el.style.display = ins.querySelector('iframe') ? '' : 'none'; // ad-status 없는 드문 경우: 프레임 존재로 판별
      return;
    }
    el.style.display='none'; return; // 응답 전에도 접힌 상태 유지: 충전 확정 시 observer가 즉시 다시 표시
  }
  if(el.querySelector('iframe')){ el.style.display=''; return; } // 타 네트워크(Adsterra/AdFit/Dable) 실제 렌더
  if(!el.firstChild) el.style.display='none';
}
function watchAdSlots(){
  document.querySelectorAll('.ad-slot').forEach(el=>{
    if(el._tcAdWatched) return; el._tcAdWatched=true;
    new MutationObserver(()=>evaluateAdSlot(el)).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['data-adsbygoogle-status','data-ad-status']});
  });
}
function evaluateAllAdSlots(){ document.querySelectorAll('.ad-slot').forEach(evaluateAdSlot); }
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>{watchAdSlots();evaluateAllAdSlots();});}
else{ watchAdSlots(); evaluateAllAdSlots(); }
window.addEventListener('load',()=>{ watchAdSlots(); evaluateAllAdSlots(); setTimeout(evaluateAllAdSlots,3500); setTimeout(evaluateAllAdSlots,8000); });
document.addEventListener('DOMContentLoaded',()=>{
  const hasAdsense = NET.adsense.startsWith("pub-");
  if(hasAdsense){const s=loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-'+NET.adsense);s.crossOrigin='anonymous';}
  if(NET.adfitMid||NET.adfitTop||NET.adfitBottom) loadScript('https://t1.daumcdn.net/kas/static/ba.min.js');
  if(NET.coupangId) loadScript('https://ads-partners.coupang.com/g.js');
  document.querySelectorAll('.ad-slot').forEach(el=>{
    const t=el.dataset.pos||'';
    if(t==='mid' && NET.adfitMid){
      el.innerHTML='<ins class="kakao_ad_area" style="display:none" data-ad-unit="'+NET.adfitMid+'" data-ad-width="728" data-ad-height="90"></ins>';return;
    }
    if(t==='mid' && NET.adsterra728){ fillAdsterra728(el); return; }
    if(t==='bottom' && NET.dableWidget){
      el.innerHTML='<div data-widget-id="'+NET.dableWidget+'" data-widget-name="dable"></div>';return;
    }
    if(t==='bottom' && !NET.dableWidget && !NET.coupangId && NET.adsterraNative){ fillAdsterraNative(el); return; }
    if(t==='bottom' && NET.coupangId){
      const d=document.createElement('div');el.replaceWith(d);
      new PartnersCoupang.G({id:parseInt(NET.coupangId),template:'carousel',trackingCode:NET.coupangTracking,width:'680',height:'140',tsource:''});return;
    }
    if(hasAdsense) fillAdsense(el);
  });
});
