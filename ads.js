
// ===== 멀티 광고 네트워크 설정: 가입한 회사의 ID만 채우면 해당 위치에 자동 게재 =====
// 위치 분리 원칙(정책 충돌 방지): 상단=애드센스 / 중단=애드핏(없으면 애드센스) / 하단=데이블·쿠팡(없으면 애드센스)
const NET = {
  adsense: "pub-3867118796714043",      // Google AdSense ca-pub 번호
  adfitTop: "", adfitMid: "", adfitBottom: "", // Kakao AdFit 광고단위 ID (DAN-...)
  dableWidget: "",                       // Dable 위젯 ID
  coupangId: "", coupangTracking: ""     // Coupang Partners ID / 추적코드
};
function loadScript(src){const s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s);return s;}
function fillAdsense(el){
  el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-'+NET.adsense+'" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>';
  (window.adsbygoogle=window.adsbygoogle||[]).push({});
}
document.addEventListener('DOMContentLoaded',()=>{
  const hasAdsense = NET.adsense!=="pub-XXXXXXXXXXXXXXXX";
  if(hasAdsense){const s=loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-'+NET.adsense);s.crossOrigin='anonymous';}
  if(NET.adfitMid||NET.adfitTop||NET.adfitBottom) loadScript('https://t1.daumcdn.net/kas/static/ba.min.js');
  if(NET.coupangId) loadScript('https://ads-partners.coupang.com/g.js');
  document.querySelectorAll('.ad-slot').forEach(el=>{
    const t=el.dataset.pos||'';
    if(t==='mid' && NET.adfitMid){
      el.innerHTML='<ins class="kakao_ad_area" style="display:none" data-ad-unit="'+NET.adfitMid+'" data-ad-width="728" data-ad-height="90"></ins>';return;
    }
    if(t==='bottom' && NET.dableWidget){
      el.innerHTML='<div data-widget-id="'+NET.dableWidget+'" data-widget-name="dable"></div>';return;
    }
    if(t==='bottom' && NET.coupangId){
      const d=document.createElement('div');el.replaceWith(d);
      new PartnersCoupang.G({id:parseInt(NET.coupangId),template:'carousel',trackingCode:NET.coupangTracking,width:'680',height:'140',tsource:''});return;
    }
    if(hasAdsense) fillAdsense(el);
  });
});
