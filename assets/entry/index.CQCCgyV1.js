import{j as e,A as a,m as i,r as t,R as n,a as r,H as o,L as l,u as c,b as s,c as _,d,e as m}from"../chunks/vendor.CBPACBTN.js";!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver((e=>{for(const i of e)if("childList"===i.type)for(const e of i.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&a(e)})).observe(document,{childList:!0,subtree:!0})}function a(e){if(e.ep)return;e.ep=!0;const a=function(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?a.credentials="include":"anonymous"===e.crossOrigin?a.credentials="omit":a.credentials="same-origin",a}(e);fetch(e.href,a)}}();const h="_text-animation_1h9c1_213",p={window:"_window_8ox57_2",window__message:"_window__message_8ox57_13",window__panel:"_window__panel_8ox57_21",window__panel__iconWrapper:"_window__panel__iconWrapper_8ox57_33",window__panel__navButtons:"_window__panel__navButtons_8ox57_38",window__panel__navButtons__navButton:"_window__panel__navButtons__navButton_8ox57_43",window__panel__navButtons__navButton__arrow:"_window__panel__navButtons__navButton__arrow_8ox57_48",disabled:"_disabled_8ox57_59"},u=()=>e.jsxs("a",{href:"https://t.me/+yFsUa_nD88piNjg6",target:"_blank",rel:"noopener noreferrer",className:"_button_aa3bm_1",children:[e.jsx("div",{className:"_icon_aa3bm_47",children:e.jsx("svg",{width:16,height:16,className:"bi bi-telegram",viewBox:"0 0 16 16",fill:"currentColor",children:e.jsx("path",{d:"M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.3 6A388.8 388.8 0 0 0 3 8.3c0 .2.3.3.7.4H4l1.2.4.9-.3a82.9 82.9 0 0 1 3.6-2.1l-2 1.9-.3.3a8.2 8.2 0 0 1-.2.2c-.4.4-.7.7 0 1.1A66.2 66.2 0 0 1 9 11.4l.3.2c.3.2.6.4 1 .4.2 0 .4-.2.5-.8l1-5.8a1.4 1.4 0 0 0-.1-.3.3.3 0 0 0-.1-.2.5.5 0 0 0-.3 0c-.3 0-.8 0-3 1z"})})}),"Telegram"]}),x=({children:t,direction:n,selectedIcon:r,showMessage:o=!0})=>e.jsx(a,{mode:"wait",custom:n,children:r?e.jsx(i.div,{custom:n,initial:{opacity:0,x:n>0?100:-100},animate:{opacity:1,x:0},exit:{opacity:0,x:n>0?-100:100},transition:{duration:.3},layout:!0,style:{width:"100%",height:"100%"},children:t},r):o&&e.jsx(i.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.3},children:e.jsx("div",{className:p.window__message,children:e.jsx("h2",{children:"Выберите персонажа"})})},"message")}),k={menu:"_menu_15kr5_2",menu__left:"_menu__left_15kr5_14",menu__left__pic:"_menu__left__pic_15kr5_24",menu__right:"_menu__right_15kr5_35",menu__right__titleblock:"_menu__right__titleblock_15kr5_52",menu__right__titleblock__fullname:"_menu__right__titleblock__fullname_15kr5_60",menu__right__titleblock__maininfo:"_menu__right__titleblock__maininfo_15kr5_63"};function v(e){if(!Number.isInteger(e)||e<0)throw new Error("Возраст должен быть неотрицательным целым числом");const a=e%10,i=e%100;return i>=11&&i<=19?"лет":1===a?"год":a>=2&&a<=4?"года":"лет"}const g={button:"_button_1jwbf_1",icon:"_icon_1jwbf_39"},b=({text:a})=>e.jsx(e.Fragment,{children:a.split("").map(((a,i)=>{const t=" "===a?" ":a;return e.jsx("span",{style:{animationDelay:.05*i+"s"},children:t},i)}))}),y={modalOverlay:"_modalOverlay_1iw7e_2",modalOverlay__content:"_modalOverlay__content_1iw7e_15",modalOverlay__closeButton:"_modalOverlay__closeButton_1iw7e_29",modalOverlay__textContent:"_modalOverlay__textContent_1iw7e_42",modalOverlay__navigation:"_modalOverlay__navigation_1iw7e_48",modalOverlay__arrowRight:"_modalOverlay__arrowRight_1iw7e_54",modalOverlay__arrowLeft:"_modalOverlay__arrowLeft_1iw7e_54",modalOverlay__title:"_modalOverlay__title_1iw7e_67",modalOverlay__textBlock:"_modalOverlay__textBlock_1iw7e_86",modalOverlay__textBlock__textCont:"_modalOverlay__textBlock__textCont_1iw7e_89",modalOverlay__pageIndicator:"_modalOverlay__pageIndicator_1iw7e_104",fadeIn:"_fadeIn_1iw7e_116",fadeOut:"_fadeOut_1iw7e_120",disabled:"_disabled_1iw7e_124"},w=e=>{if(!e||"string"!=typeof e)return[];if(!/<p>.*?<\/p>/g.test(e))return[`<p>${e}</p>`];if("undefined"==typeof window)return[e];const a=e.split("<p>").filter(Boolean).map((e=>e.split("</p>")[0].trim())),i=a.pop()||null,t=[];let n="",r=0;const o=window.innerWidth<=768,l=window.innerHeight,c=document.createElement("div");c.style.position="absolute",c.style.visibility="hidden",c.style.maxWidth="600px",c.style.fontFamily="graphr, sans-serif",c.style.fontSize="1.6rem",c.style.lineHeight="1.5",c.style.padding="10px",c.style.wordWrap="break-word",document.body.appendChild(c);try{const e=o&&l>400?600:800,s=o?500:1/0;if(a.length>0){const e=a.shift().trim();n=`<p>${e}</p>`,r=e.length}if(a.forEach((a=>{const i=a.trim(),o=`<p>${i}</p>`,l=i.length;c.innerHTML=n+o,c.scrollHeight>e||r+l>s?(t.push(n),n=o,r=l):(n+=o,r+=l)})),n&&t.push(n),i&&i.trim()){const a=`<blockquote>${i.trim()}</blockquote>`;c.innerHTML=n+a,c.scrollHeight>e?(t.push(n),t.push(a)):t[t.length-1]+=a}}finally{document.body.removeChild(c)}return t},f={};function N(e){const[a,i]=t.useState(null),[n,r]=t.useState(!0),[o,l]=t.useState(null),c=t.useRef(!0);return t.useEffect((()=>(c.current=!0,(async()=>{if(f[e])return i(f[e]),void r(!1);try{const a=await fetch(e);if(!a.ok)throw new Error("Failed to load data");const t=await a.json();f[e]=t,c.current&&i(t)}catch(a){c.current&&l(a.message)}finally{c.current&&r(!1)}})(),()=>{c.current=!1})),[e]),{data:a,loading:n,error:o}}const $=e=>{if(!e)return"Не найден";const{name:a}=e;return["Фауст","Лонариус"].includes(a)?`${a}а`:a},B=({isOpen:a,onClose:i,id:r})=>{const[o,l]=t.useState(!1),{data:c,loading:s,error:_}=N("https://gist.githubusercontent.com/igorao79/17a1e2924e5dbee9371956c24be2a31b/raw/24a8ba7d250a00e594387072aa0fc47641c6b8a6/chlore.json"),{currentPage:d,nextPage:m,prevPage:h}=((e=0)=>{const[a,i]=t.useState(e);return{currentPage:a,nextPage:e=>{a<e-1&&i(a+1)},prevPage:()=>{a>0&&i(a-1)},setCurrentPage:i}})(),{character:p,pages:u}=t.useMemo((()=>{if(!c||!r)return{character:null,pages:[]};const e=((e,a)=>{const i=e[a];if(i&&i.lore&&"string"==typeof i.lore)return i})(c,r);return e&&e.lore&&""!==e.lore.trim()?{character:e,pages:w(e.lore)}:{character:e,pages:[]}}),[c,r]);return a&&p&&0!==u.length?s?n.createPortal(e.jsx("div",{className:y.modalOverlay,children:e.jsx("div",{className:y.loading,children:"Loading..."})}),document.body):_?n.createPortal(e.jsx("div",{className:y.modalOverlay,children:e.jsxs("div",{className:y.error,children:["Error: ",_]})}),document.body):n.createPortal(e.jsx("div",{className:y.modalOverlay,children:e.jsxs("div",{className:y.modalOverlay__content,onClick:e=>e.stopPropagation(),children:[e.jsx("button",{onClick:i,className:y.modalOverlay__closeButton,children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 30 30",children:e.jsx("path",{d:"M7 4H6L4 6v2l8 7-8 7v2l2 2h2l7-8 7 8h2l2-2v-2l-8-7 8-7V6l-2-2h-2l-7 8-7-8H7z"})})}),e.jsxs("div",{className:y.modalOverlay__textContent,children:[e.jsxs("div",{className:y.modalOverlay__navigation,children:[e.jsx("button",{onClick:()=>{l(!0),setTimeout((()=>{h(),l(!1)}),300)},disabled:0===d,className:`${y.modalOverlay__arrowLeft} ${0===d?y.disabled:""}`,children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",children:e.jsx("path",{d:"m12.718 4.707-1.413-1.415L2.585 12l8.72 8.707 1.413-1.415L6.417 13H20v-2H6.416l6.302-6.293z"})})}),e.jsx("button",{onClick:()=>{l(!0),setTimeout((()=>{m(u.length),l(!1)}),300)},disabled:d===u.length-1,className:`${y.modalOverlay__arrowRight} ${d===u.length-1?y.disabled:""}`,children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",children:e.jsx("path",{d:"M11.293 4.707 17.586 11H4v2h13.586l-6.293 6.293 1.414 1.414L21.414 12l-8.707-8.707-1.414 1.414z"})})})]}),e.jsxs("h2",{className:y.modalOverlay__title,children:["Лор ",$(p)]}),e.jsx("div",{className:y.modalOverlay__textBlock,children:e.jsx("div",{className:`${y.modalOverlay__textBlock__textCont} ${o?y.fadeOut:y.fadeIn}`,dangerouslySetInnerHTML:{l:u[d]||""}})}),e.jsxs("div",{className:y.modalOverlay__pageIndicator,children:["Страница ",d+1," из ",u.length]})]})]})}),document.body):null},A=({id:a})=>{const[i,n]=t.useState(!1),r=()=>{n(!1)},o=e=>{"Escape"===e.key&&r()};return t.useEffect((()=>(window.addEventListener("keydown",o),()=>{window.removeEventListener("keydown",o)})),[]),e.jsxs(e.Fragment,{children:[e.jsx("div",{className:g.wrapper,children:e.jsxs("button",{className:g.button,onClick:()=>{n(!0)},children:[e.jsx("span",{className:`${h} _text-animation-slow_1h9c1_235`,children:e.jsx(b,{text:"Читать лор"})}),e.jsx("svg",{fill:"currentColor",viewBox:"0 0 24 24",className:g.icon,children:e.jsx("path",{clipRule:"evenodd",d:"M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z",fillRule:"evenodd"})})]})}),i&&e.jsx(B,{isOpen:i,onClose:r,id:a})]})};function S({id:a,src:i,name:t,surname:n="",age:r="?",height:o,bd:l="?"}){return e.jsxs("div",{id:a,className:k.menu,children:[e.jsx("div",{className:k.menu__left,children:e.jsxs("picture",{className:k.menu__left__pic,children:[e.jsx("source",{srcSet:`./pics/char/picsfull/${i}.avif`,type:"image/avif"}),e.jsx("source",{srcSet:`./pics/char/picsfull/${i}.webp`,type:"image/webp"}),e.jsx("img",{src:`./pics/char/picsfull/${i}.png`,alt:`icon-${t}`,loading:"lazy"})]})}),e.jsxs("div",{className:k.menu__right,children:[e.jsxs("div",{className:k.menu__right__titleblock,children:[e.jsx("h2",{className:`${k.menu__right__titleblock__fullname} ${h}`,children:e.jsx(b,{text:`${t} ${n}`})}),e.jsxs("div",{className:k.menu__right__titleblock__maininfo,children:[e.jsx("span",{className:`${k.menu__right__titleblock__maininfo__age} ${h}`,children:e.jsx(b,{text:`Возраст: ${r} ${"?"!==r&&v(r)}`})}),e.jsx("span",{className:`${k.menu__right__titleblock__maininfo__height} ${h}`,children:e.jsx(b,{text:`Рост: ${o} см`})}),e.jsx("span",{className:`${k.menu__right__titleblock__maininfo__bd} ${h}`,children:e.jsx(b,{text:`День рождения: ${l}`})})]})]}),e.jsx(A,{id:a})]})]})}const V=t.createContext(),D={light:{"--primary-color":"#000000","--background-color":"#ffffff","--text-color":"#000000","--secondary-color":"#666666","--accent-color":"#3498db"},dark:{"--primary-color":"#ffffff","--background-color":"#1a1a1a","--text-color":"#ffffff","--secondary-color":"#999999","--accent-color":"#3498db"}},E=({children:a})=>{const i=localStorage.getItem("theme")||"light",[n,r]=t.useState(i),o=t.useCallback((e=>{const a=D[e];Object.entries(a).forEach((([e,a])=>{document.documentElement.style.setProperty(e,a)})),document.documentElement.setAttribute("data-theme",e)}),[]),l=t.useCallback((()=>{const e="light"===n?"dark":"light";r(e),o(e),localStorage.setItem("theme",e)}),[n,o]);t.useEffect((()=>{o(i)}),[o,i]);const c=t.useMemo((()=>({theme:n,toggleTheme:l})),[n,l]);return e.jsx(V.Provider,{value:c,children:a})},G=r.memo((({src:a,index:i,onClick:n})=>{const{theme:r}=t.useContext(V),o=t.useMemo((()=>({avif:`./pics/icons/${a}.avif`,webp:`./pics/icons/${a}.webp`,png:`./pics/icons/${a}.png`})),[a]);return e.jsxs("div",{children:[e.jsx("hr",{}),e.jsx("button",{className:"_btn_1u0aw_2",onClick:n,children:e.jsxs("picture",{className:"_btn__pic_1u0aw_19 "+("dark"===r?"_darkTheme_1u0aw_30":""),children:[e.jsx("source",{srcSet:o.avif,type:"image/avif"}),e.jsx("source",{srcSet:o.webp,type:"image/webp"}),e.jsx("img",{src:o.png,alt:`icon-${i}`,loading:"eager",decoding:"async"})]})}),e.jsx("hr",{})]})}));G.displayName="Icon";const O=({icons:n,onIconClick:r})=>{const[o,l]=t.useState(0),c=n.slice(o,o+3);return e.jsx("div",{className:p.window__panel,children:e.jsxs("div",{className:p.window__panel__navButtons,children:[e.jsx("button",{className:`${p.window__panel__navButtons__navButton} ${0===o?p.disabled:""}`,onClick:()=>{l((e=>e>0?e-1:e))},disabled:0===o,"aria-label":"Назад",children:e.jsx("span",{className:p.window__panel__navButtons__navButton__arrow,children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",children:e.jsx("path",{d:"m3.293 11.293 1.414 1.414L11 6.414V20h2V6.414l6.293 6.293 1.414-1.414L12 2.586l-8.707 8.707z"})})})}),e.jsx("div",{className:p.window__panel__iconWrapper,children:e.jsx(a,{mode:"popLayout",children:c.map(((a,t)=>e.jsx(i.div,{initial:{y:-50,opacity:0},animate:{y:0,opacity:1},exit:{y:50,opacity:0},transition:{duration:.3,ease:"easeOut"},className:p.window__panel__iconWrapper__icons,children:e.jsx(G,{src:a,index:o+t,onClick:()=>r(a)})},o+t)))})}),e.jsx("button",{className:`${p.window__panel__navButtons__navButton} ${o>=n.length-3?p.disabled:""}`,onClick:()=>{l((e=>e<n.length-3?e+1:e))},disabled:o>=n.length-3,"aria-label":"Вперёд",children:e.jsx("span",{className:p.window__panel__navButtons__navButton__arrow,children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",children:e.jsx("path",{d:"M13 17.586V4h-2v13.586l-6.293-6.293-1.414 1.414L12 21.414l8.707-8.707-1.414-1.414L13 17.586z"})})})})]})})},M=["faust","lonarius","vivian","akito"];function C(){var a,i,n,r,o,l,c;const[s,_]=t.useState(null),[d,m]=t.useState(1),[h,k]=t.useState(!1),{data:v,loading:g,error:b}=N("https://gist.githubusercontent.com/igorao79/17a1e2924e5dbee9371956c24be2a31b/raw/24a8ba7d250a00e594387072aa0fc47641c6b8a6/chlore.json"),y=t.useCallback((e=>{h||(k(!0),m(s?M.indexOf(e)>M.indexOf(s)?1:-1:1),_(e),setTimeout((()=>k(!1)),300))}),[h,s]);return g?e.jsx("div",{className:p.loading,children:"Loading..."}):b?e.jsxs("div",{className:p.error,children:["Error: ",b]}):e.jsxs("div",{className:p.window,children:[e.jsx(u,{}),e.jsx(O,{icons:M,onIconClick:y}),e.jsx(x,{selectedIcon:s,direction:d,children:s&&v[s]&&e.jsx(S,{id:s,src:null==(a=v[s])?void 0:a.src,name:null==(i=v[s])?void 0:i.name,surname:null==(n=v[s])?void 0:n.surname,age:null==(r=v[s])?void 0:r.age,height:null==(o=v[s])?void 0:o.height,bd:null==(l=v[s])?void 0:l.bd,lore:null==(c=v[s])?void 0:c.lore})})]})}const j="_aboutblock__header__textblock__text_1nt2p_38",I="_aboutblock__header__textblock__text__icon_1nt2p_44",L="_aboutblock__header__textblock__text__icon__main_1nt2p_47",P="_aboutblock__header__textblock__text__icon__small_1nt2p_51",T={member:"_member_12fwj_2",member__imageWrapper:"_member__imageWrapper_12fwj_15",member__image:"_member__image_12fwj_15",member__info:"_member__info_12fwj_23",member__info__details:"_member__info__details_12fwj_30",member__info__details__name:"_member__info__details__name_12fwj_35",member__info__details__role:"_member__info__details__role_12fwj_40",member__info__bio:"_member__info__bio_12fwj_44","member--igor":"_member--igor_12fwj_1","member--lesya":"_member--lesya_12fwj_1"},H={igor:{src:"igorpic",id:"igor",name:"Игорь",bookteam:"Автор",developerteam:"Главный разработчик",bio:"d"},lesya:{src:"lesyapic",id:"lesya",name:"Леся",bookteam:"Художник, Соавтор",bio:"o"}},F=r.memo((({memberId:a})=>{const{theme:i}=t.useContext(V),n=t.useMemo((()=>H[a]),[a]);if(!n)return e.jsx("div",{className:T.member__notfound,children:"Участник не найден."});const{imageSrc:r,safeId:o}=t.useMemo((()=>({imageSrc:`./pics/team/${n.src}`,safeId:`member--${n.id.replace(/\s+/g,"-").toLowerCase()}`})),[n]);return r?e.jsxs("div",{className:T.member,id:o,children:[e.jsx("div",{className:T.member__imageWrapper,children:e.jsxs("picture",{className:`${T.member__imageContainer} ${"dark"===i?T.darkTheme:""}`,children:[e.jsx("source",{srcSet:`${r}.avif`,type:"image/avif"}),e.jsx("source",{srcSet:`${r}.webp`,type:"image/webp"}),e.jsx("img",{src:`${r}.png`,alt:n.name,className:T.member__image,loading:"lazy",decoding:"async"})]})}),e.jsxs("div",{className:T.member__info,children:[e.jsxs("div",{className:T.member__info__details,children:[e.jsx("h3",{className:T.member__info__details__name,children:n.name}),e.jsx("p",{className:T.member__info__details__role,children:n.bookteam})]}),e.jsx("p",{className:T.member__info__bio,children:n.bio})]})]}):e.jsx("div",{className:T.member__notfound,children:"Изображение не найдено."})}));F.displayName="BookMember";const z=r.memo((({memberId:a})=>{const{theme:i}=t.useContext(V),n=t.useMemo((()=>H[a]),[a]);if(!n)return e.jsx("div",{className:T.member__notfound,children:"Участник не найден."});const{imageSrc:r,safeId:o}=t.useMemo((()=>({imageSrc:`./pics/team/${n.src}`,safeId:`member--${n.id.replace(/\s+/g,"-").toLowerCase()}`})),[n]);return r?e.jsxs("div",{className:`${T.member} ${T[`member--${n.id}`]}`,id:o,children:[e.jsx("div",{className:T.member__imageWrapper,children:e.jsxs("picture",{className:`${T.member__imageContainer} ${"dark"===i?T.darkTheme:""}`,children:[e.jsx("source",{srcSet:`${r}.avif`,type:"image/avif"}),e.jsx("source",{srcSet:`${r}.webp`,type:"image/webp"}),e.jsx("img",{src:`${r}.png`,alt:n.name,className:T.member__image,loading:"lazy",decoding:"async"})]})}),e.jsx("div",{className:T.member__info,children:e.jsxs("div",{className:T.member__info__details,children:[e.jsx("h3",{className:T.member__info__details__name,children:n.name}),e.jsx("p",{className:T.member__info__details__role,children:n.developerteam})]})})]}):e.jsx("div",{className:T.member__notfound,children:"Изображение не найдено."})}));function Z(){return e.jsxs("div",{className:"_aboutblock_1nt2p_2",children:[e.jsxs("header",{className:"_aboutblock__header_1nt2p_15",children:[e.jsx("h2",{className:"_aboutblock__header__htitle_1nt2p_22",children:"О нашей книге"}),e.jsxs("div",{className:"_aboutblock__header__textblock_1nt2p_27",children:[e.jsxs("div",{className:j,children:[e.jsxs("svg",{className:I,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 122.9 108.7",width:"50",height:"50",children:[e.jsx("path",{className:L,d:"M95.2 91.4h-.8a1.6 1.6 0 0 1-1.6-1.7 23 23 0 0 0-1.9-9 27 27 0 0 0-13.4-13.5 23 23 0 0 0-9.1-1.8 1.6 1.6 0 0 1-1.6-1.7V63a1.6 1.6 0 0 1 1.6-1.7 22.9 22.9 0 0 0 9.1-1.8 25.4 25.4 0 0 0 8-5.5 25.6 25.6 0 0 0 5.4-7.9 22.9 22.9 0 0 0 1.8-9.1 1.6 1.6 0 0 1 1.7-1.6h.8a1.6 1.6 0 0 1 1.7 1.6 22.9 22.9 0 0 0 1.8 9.1 25.2 25.2 0 0 0 5.5 8 25.2 25.2 0 0 0 8 5.4 22.9 22.9 0 0 0 9 1.8A1.6 1.6 0 0 1 123 63v.8a1.6 1.6 0 0 1-1.7 1.7 23 23 0 0 0-9 1.8 27 27 0 0 0-13.5 13.4 23 23 0 0 0-1.8 9.1 1.6 1.6 0 0 1-1.7 1.7Z"}),e.jsx("path",{className:P,d:"M62 50h-.3a.4.4 0 0 1-.4-.4 6 6 0 0 0-.5-2.4 7.2 7.2 0 0 0-1.7-2.2 7.2 7.2 0 0 0-2.2-1.8 6 6 0 0 0-2.4-.4.4.4 0 0 1-.4-.4V42a.4.4 0 0 1 .4-.4 6 6 0 0 0 2.4-.5 7.2 7.2 0 0 0 2.2-1.7 7.2 7.2 0 0 0 1.7-2.2 6 6 0 0 0 .5-2.4.4.4 0 0 1 .4-.4h.3a.4.4 0 0 1 .4.4 6 6 0 0 0 .5 2.4 7.2 7.2 0 0 0 1.7 2.2 7.2 7.2 0 0 0 2.2 1.7 6 6 0 0 0 2.4.5.4.4 0 0 1 .4.4v.3a.4.4 0 0 1-.4.4 6 6 0 0 0-2.4.5 7.2 7.2 0 0 0-2.2 1.7 7.2 7.2 0 0 0-1.7 2.2 6 6 0 0 0-.5 2.4.4.4 0 0 1-.4.4Z"})]}),e.jsx("p",{children:"Основной жанр нашей книги - фэнтэзи с элементами дарк фэнтэзи, романтики и приключений"})]}),e.jsxs("div",{className:j,children:[e.jsxs("svg",{className:I,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 122.88 108.69",width:"50",height:"50",children:[e.jsx("path",{className:L,d:"M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"}),e.jsx("path",{className:P,d:"M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z",fill:"black",transform:"scale(0.4) translate(90,70)"})]}),e.jsxs("p",{children:["Книга была создана 27 июня 2024 года — совершенно спонтанно, без чётких целей. За её развитием вы можете следить ",e.jsx("a",{href:"https://t.me/+yFsUa_nD88piNjg6",children:"здесь"})]})]}),e.jsxs("div",{className:j,children:[e.jsxs("svg",{className:I,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 122.88 108.69",width:"50",height:"50",children:[e.jsx("path",{className:L,d:"M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"}),e.jsx("path",{className:P,d:"M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z",fill:"black",transform:"scale(0.4) translate(90,70)"})]}),e.jsx("p",{children:"adsada"})]}),e.jsxs("div",{className:j,children:[e.jsxs("svg",{className:I,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 122.88 108.69",width:"50",height:"50",children:[e.jsx("path",{className:L,d:"M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"}),e.jsx("path",{className:P,d:"M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z",fill:"black",transform:"scale(0.4) translate(90,70)"})]}),e.jsx("p",{children:"adsada"})]})]})]}),e.jsxs("div",{className:"_aboutblock__main_1nt2p_55",children:[e.jsx("h2",{className:"_aboutblock__main__btitle_1nt2p_63",children:"Творческая команда"}),e.jsxs("div",{className:"_aboutblock__main__authors_1nt2p_68",children:[e.jsx(F,{memberId:"igor"}),e.jsx(F,{memberId:"lesya"})]}),e.jsx("h2",{className:"_aboutblock__main__dtitle_1nt2p_63",children:"Команда разработки"}),e.jsx("div",{className:"_aboutblock__main__developers_1nt2p_68",children:e.jsx(z,{memberId:"igor"})})]})]})}z.displayName="DeveloperMember";const R={main:"_main_1lvp5_1",main__header:"_main__header_1lvp5_15",main__header__pic:"_main__header__pic_1lvp5_21",darkTheme:"_darkTheme_1lvp5_35",main__header__title:"_main__header__title_1lvp5_38",main__nav:"_main__nav_1lvp5_42",main__nav__perexod:"_main__nav__perexod_1lvp5_45",main__nav__perexod__link:"_main__nav__perexod__link_1lvp5_52",characters:"_characters_1lvp5_56"},W=({src:a,alt:i})=>{const{theme:n}=t.useContext(V),r=a.replace("-black","");return e.jsxs("picture",{className:`${R.main__header__pic} ${"dark"===n?R.darkTheme:""}`,children:[e.jsx("source",{srcSet:`${r}.avif`,type:"image/avif"}),e.jsx("source",{srcSet:`${r}.webp`,type:"image/webp"}),e.jsx("img",{src:`${r}.png`,alt:i,loading:"lazy"})]})};function q(){return e.jsx(o,{children:e.jsxs("div",{className:R.main,children:[e.jsxs("header",{className:R.main__header,children:[e.jsx("a",{href:"/",children:e.jsx(W,{src:"./pics/logo/sclogo",alt:"Логотип"})}),e.jsx("h1",{className:R.main__header__title,children:"soul cycle"})]}),e.jsx("nav",{className:R.main__nav,children:e.jsxs("ul",{className:R.main__nav__perexod,children:[e.jsx("li",{className:R.main__nav__perexod__link,children:e.jsx(l,{to:"/",children:"Главная"})}),e.jsx("li",{className:R.main__nav__perexod__link,children:e.jsx(l,{to:"/characters",children:"Персонажи"})}),e.jsx("li",{className:R.main__nav__perexod__link,children:e.jsx(l,{to:"/about",children:"О нас"})})]})}),e.jsx(U,{})]})})}function U(){const t=c();return e.jsx(a,{mode:"wait",children:e.jsxs(s,{location:t,children:[e.jsx(_,{path:"/",element:e.jsx("div",{})}),e.jsx(_,{path:"/characters",element:e.jsx(i.div,{className:R.characters,initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},children:e.jsx(C,{})})}),e.jsx(_,{path:"/about",element:e.jsx(i.div,{className:R.about,initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},children:e.jsx(Z,{})})})]},t.pathname)})}const K={v:"4.8.0",meta:{g:"LottieFiles AE 1.0.0",a:"Bas Milius",k:"Meteocons, Weather icons, Icon set",d:"Clear day - Meteocons.com",tc:""},fr:60,ip:0,op:360,w:512,h:512,nm:"clear-day",ddd:0,assets:[],layers:[{ddd:0,ind:1,ty:4,nm:"rays",sr:1,ks:{o:{a:0,k:100,ix:11},r:{a:1,k:[{i:{x:[.833],y:[.833]},o:{x:[.167],y:[.167]},t:0,s:[0]},{t:359,s:[45]}],ix:10},p:{a:0,k:[256,256,0],ix:2},a:{a:0,k:[0,0,0],ix:1},s:{a:0,k:[100,100,100],ix:6}},ao:0,shapes:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[180,0],[130.345,0]],c:!1},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ind:1,ty:"sh",ix:2,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[-130.345,0],[-180,0]],c:!1},ix:2},nm:"Path 2",mn:"ADBE Vector Shape - Group",hd:!1},{ind:2,ty:"sh",ix:3,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[127.279,127.279],[92.168,92.168]],c:!1},ix:2},nm:"Path 3",mn:"ADBE Vector Shape - Group",hd:!1},{ind:3,ty:"sh",ix:4,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[-92.168,-92.168],[-127.279,-127.279]],c:!1},ix:2},nm:"Path 4",mn:"ADBE Vector Shape - Group",hd:!1},{ind:4,ty:"sh",ix:5,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[-127.279,127.279],[-92.168,92.168]],c:!1},ix:2},nm:"Path 5",mn:"ADBE Vector Shape - Group",hd:!1},{ind:5,ty:"sh",ix:6,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[92.168,-92.168],[127.279,-127.279]],c:!1},ix:2},nm:"Path 6",mn:"ADBE Vector Shape - Group",hd:!1},{ind:6,ty:"sh",ix:7,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[0,180],[0,130.345]],c:!1},ix:2},nm:"Path 7",mn:"ADBE Vector Shape - Group",hd:!1},{ind:7,ty:"sh",ix:8,ks:{a:0,k:{i:[[0,0],[0,0]],o:[[0,0],[0,0]],v:[[0,-130.345],[0,-180]],c:!1},ix:2},nm:"Path 8",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"st",c:{a:0,k:[.984313726425,.749019622803,.141176477075,1],ix:3},o:{a:0,k:100,ix:4},w:{a:0,k:24,ix:5},lc:2,lj:1,ml:10,bm:0,nm:"Stroke 1",mn:"ADBE Vector Graphic - Stroke",hd:!1}],ip:0,op:360,st:0,bm:0},{ddd:0,ind:2,ty:4,nm:"core",sr:1,ks:{o:{a:0,k:100,ix:11},r:{a:0,k:0,ix:10},p:{a:0,k:[256,256,0],ix:2},a:{a:0,k:[0,0,0],ix:1},s:{a:0,k:[100,100,100],ix:6}},ao:0,shapes:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[0,-46.392],[46.392,0],[0,46.392],[-46.392,0]],o:[[0,46.392],[-46.392,0],[0,-46.392],[46.392,0]],v:[[84,0],[0,84],[-84,0],[0,-84]],c:!0},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"st",c:{a:0,k:[.972549021244,.686274528503,.0941176489,1],ix:3},o:{a:0,k:100,ix:4},w:{a:0,k:6,ix:5},lc:1,lj:1,ml:10,bm:0,nm:"Stroke 1",mn:"ADBE Vector Graphic - Stroke",hd:!1},{ty:"gf",o:{a:0,k:100,ix:10},r:1,bm:0,g:{p:5,k:{a:0,k:[0,.984,.749,.141,.225,.984,.749,.141,.45,.984,.749,.141,.725,.973,.684,.092,1,.961,.62,.043],ix:9}},s:{a:0,k:[-41.517,-71.871],ix:5},e:{a:0,k:[42.497,73.645],ix:6},t:1,nm:"Gradient Fill 1",mn:"ADBE Vector Graphic - G-Fill",hd:!1}],ip:0,op:360,st:0,bm:0}],markers:[]},J={v:"5.5.8",fr:29.9700012207031,ip:0,op:160.000006516934,w:150,h:150,nm:"icon_moon",ddd:0,assets:[],layers:[{ddd:0,ind:1,ty:4,nm:"moon Outlines",sr:1,ks:{o:{a:0,k:100,ix:11},r:{a:0,k:0,ix:10},p:{a:0,k:[77.728,68.567,0],ix:2},a:{a:0,k:[583,600,0],ix:1},s:{a:0,k:[45,45,100],ix:6}},ao:0,shapes:[{ty:"gr",it:[{ty:"gr",it:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[0,0],[0,13.612],[-13.612,0],[0,0],[0,4.127],[-13.613,0],[0,0],[0,-13.612],[13.613,0],[0,0],[0,-4.127],[13.613,0]],o:[[-13.612,0],[0,-13.613],[0,0],[-1.971,-3.611],[0,-13.612],[0,0],[13.613,0],[0,13.614],[0,0],[1.971,3.611],[0,13.612],[0,0]],v:[[-57.605,42.935],[-82.292,18.248],[-57.605,-6.44],[-27.961,-6.44],[-30.971,-18.248],[-6.283,-42.935],[57.604,-42.935],[82.292,-18.248],[57.604,6.441],[27.961,6.441],[30.97,18.248],[6.282,42.935]],c:!0},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"fl",c:{a:0,k:[.733333349228,.96862745285,1,1],ix:4},o:{a:0,k:100,ix:5},r:1,bm:0,nm:"Fill 1",mn:"ADBE Vector Graphic - Fill",hd:!1},{ty:"tr",p:{a:0,k:[504.292,658.677],ix:2},a:{a:0,k:[0,0],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"Group 5",np:2,cix:2,bm:0,ix:1,mn:"ADBE Vector Group",hd:!1},{ty:"tr",p:{a:1,k:[{i:{x:.833,y:.833},o:{x:.167,y:.167},t:0,s:[504.291,658.677],to:[-3.333,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:40,s:[484.291,658.677],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:80,s:[504.291,658.677],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:120,s:[484.291,658.677],to:[0,0],ti:[-3.333,0]},{t:160.000006516934,s:[504.291,658.677]}],ix:2},a:{a:0,k:[480.291,623.677],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"c1",np:1,cix:2,bm:0,ix:1,mn:"ADBE Vector Group",hd:!1},{ty:"gr",it:[{ty:"gr",it:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[0,0],[0,7.3],[-7.3,0],[0,0],[0,-7.3],[7.299,0]],o:[[-7.3,0],[0,-7.3],[0,0],[7.299,0],[0,7.3],[0,0]],v:[[-49.017,13.239],[-62.255,.001],[-49.017,-13.238],[49.017,-13.238],[62.255,.001],[49.017,13.239]],c:!0},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"fl",c:{a:0,k:[.733333349228,.96862745285,1,1],ix:4},o:{a:0,k:100,ix:5},r:1,bm:0,nm:"Fill 1",mn:"ADBE Vector Graphic - Fill",hd:!1},{ty:"tr",p:{a:0,k:[608.408,572.45],ix:2},a:{a:0,k:[0,0],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"Group 9",np:2,cix:2,bm:0,ix:1,mn:"ADBE Vector Group",hd:!1},{ty:"tr",p:{a:1,k:[{i:{x:.833,y:.833},o:{x:.167,y:.167},t:0,s:[608.408,572.45],to:[2.361,0],ti:[-5.079,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:33,s:[624.897,572.45],to:[2.092,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:40,s:[628.408,572.45],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:80,s:[608.408,572.45],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:120,s:[628.408,572.45],to:[0,0],ti:[3.333,0]},{t:160.000006516934,s:[608.408,572.45]}],ix:2},a:{a:0,k:[608.408,548.45],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"c2",np:1,cix:2,bm:0,ix:2,mn:"ADBE Vector Group",hd:!1},{ty:"gr",it:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[23.394,0],[0,61.75],[-15.662,19.738],[-24.17,5.763],[2.294,-4.352],[0,-15.361],[-51.493,0],[-11.283,4.614],[1.603,-4.652],[19.108,-13.726]],o:[[-61.75,0],[0,-25.147],[15.552,-19.598],[4.785,-1.142],[-7.101,13.467],[0,51.492],[12.2,0],[4.556,-1.863],[-7.555,21.932],[-19.251,13.829]],v:[[2.221,111.03],[-109.767,-.958],[-85.479,-70.561],[-23.882,-109.888],[-17.49,-101.649],[-28.191,-58.205],[65.193,35.178],[100.583,28.225],[108.163,35.387],[67.407,89.892]],c:!0},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"fl",c:{a:0,k:[1,.831372559071,.352941185236,1],ix:4},o:{a:0,k:100,ix:5},r:1,bm:0,nm:"Fill 1",mn:"ADBE Vector Graphic - Fill",hd:!1},{ty:"tr",p:{a:0,k:[599.388,602.031],ix:2},a:{a:0,k:[0,0],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"banana",np:2,cix:2,bm:0,ix:3,mn:"ADBE Vector Group",hd:!1},{ty:"gr",it:[{ty:"gr",it:[{ind:0,ty:"sh",ix:1,ks:{a:0,k:{i:[[0,0],[0,6.708],[-6.708,0],[0,0],[0,0],[1.729,-4.168],[0,0]],o:[[-6.708,0],[0,-6.708],[0,0],[0,0],[-2.247,3.961],[0,0],[0,0]],v:[[-13.228,12.165],[-25.393,0],[-13.228,-12.165],[25.393,-12.165],[20.546,-3.616],[14.555,8.634],[13.089,12.165]],c:!0},ix:2},nm:"Path 1",mn:"ADBE Vector Shape - Group",hd:!1},{ty:"fl",c:{a:0,k:[.733333349228,.96862745285,1,1],ix:4},o:{a:0,k:100,ix:5},r:1,bm:0,nm:"Fill 1",mn:"ADBE Vector Graphic - Fill",hd:!1},{ty:"tr",p:{a:1,k:[{i:{x:.833,y:.833},o:{x:.167,y:.167},t:0,s:[474.245,549.909],to:[3.333,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:40,s:[494.245,549.909],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:80,s:[474.245,549.909],to:[0,0],ti:[0,0]},{i:{x:.833,y:.833},o:{x:.167,y:.167},t:120,s:[494.245,549.909],to:[0,0],ti:[3.333,0]},{t:160.000006516934,s:[474.245,549.909]}],ix:2},a:{a:0,k:[0,0],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"Group 14",np:2,cix:2,bm:0,ix:1,mn:"ADBE Vector Group",hd:!1},{ty:"tr",p:{a:0,k:[484.245,549.909],ix:2},a:{a:0,k:[475.245,549.909],ix:1},s:{a:0,k:[100,100],ix:3},r:{a:0,k:0,ix:6},o:{a:0,k:100,ix:7},sk:{a:0,k:0,ix:4},sa:{a:0,k:0,ix:5},nm:"Transformer "}],nm:"c3",np:1,cix:2,bm:0,ix:4,mn:"ADBE Vector Group",hd:!1}],ip:0,op:1798.00007323404,st:0,bm:0}],markers:[]},Q={themeButton:"_themeButton_1oj5n_1"},X=r.memo((()=>{const{theme:a,toggleTheme:i}=t.useContext(V),[n,r]=t.useState(!1),o=t.useMemo((()=>({animationData:"dark"===a?K:J,loop:!0,autoplay:!0})),[a]),l=t.useCallback((()=>{n||(i(),r(!0),setTimeout((()=>{r(!1)}),3e3))}),[n,i]);return e.jsx("button",{className:`${Q.themeButton} ${n?Q.disabled:""}`,onClick:l,disabled:n,"aria-label":"dark"===a?"Switch to Light Mode":"Switch to Dark Mode",children:e.jsx(d,{config:o,speed:1,style:{width:"35px",height:"35px",display:"block"}})})}));function Y(){return e.jsxs("div",{className:"_page_1h9c1_107",children:[e.jsx(X,{}),e.jsx(q,{})," "]})}X.displayName="ThemeToggleButton",m.createRoot(document.getElementById("root")).render(e.jsxs(E,{children:[" ",e.jsx(Y,{})]}));
