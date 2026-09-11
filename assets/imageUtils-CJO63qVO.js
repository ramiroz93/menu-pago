import{c as i}from"./index-DS1eKvmb.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=i("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("ToggleLeft",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"8",cy:"12",r:"2",key:"1nvbw3"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=i("ToggleRight",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"16",cy:"12",r:"2",key:"4ma0v8"}]]);async function g(n,e=800,o=.82){return new Promise(c=>{const t=new Image;t.onload=()=>{const r=Math.min(e/t.width,e/t.height,1),a=document.createElement("canvas");a.width=Math.round(t.width*r),a.height=Math.round(t.height*r),a.getContext("2d").drawImage(t,0,0,a.width,a.height),a.toBlob(c,"image/jpeg",o)},t.src=URL.createObjectURL(n)})}function l(n){return n&&n.split("/menu-images/")[1]||null}async function w(n,e,o="logo",c=null){const t=await g(n,o==="cover"?1200:800,.85),r=`${o}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,{error:a}=await e.storage.from("menu-images").upload(r,t,{contentType:"image/jpeg"});if(a)throw a;const{data:{publicUrl:s}}=e.storage.from("menu-images").getPublicUrl(r);return c&&m(c,e),s}async function m(n,e){const o=l(n);o&&await e.storage.from("menu-images").remove([o])}async function y(n,e,o=null){const c=await g(n),t=`${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,{error:r}=await e.storage.from("menu-images").upload(t,c,{contentType:"image/jpeg"});if(r)throw r;const{data:{publicUrl:a}}=e.storage.from("menu-images").getPublicUrl(t);return o&&m(o,e),a}export{h as C,d as T,f as a,y as b,m as d,w as u};
