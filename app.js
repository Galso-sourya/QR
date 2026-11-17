import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const qrImage=$("qrImage"), placeholder=$("placeholder"), statusText=$("statusText");
const timer=$("timer"), progress=$("progress"), notice=$("notice"), button=$("newCodeButton");
const TTL=90_000;
let app,auth,db,uid,requestRef,unsubscribe=null,expiryTimer=null,pollTimer=null,token=null,expiresAt=0;

function message(text,type=""){notice.textContent=text;notice.className=`notice ${type}`;}
function randomToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
function timeString(s){return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function stopWatch(){if(unsubscribe){unsubscribe();unsubscribe=null;}clearInterval(expiryTimer);clearInterval(pollTimer);}
function configReady(){return firebaseConfig.apiKey!=="PASTE_YOUR_API_KEY" && firebaseConfig.projectId!=="YOUR_PROJECT_ID" && firebaseConfig.databaseURL.startsWith("https://");}

async function init(){
  if(!configReady()){statusText.textContent="Firebase setup required";message("Edit firebase-config.js with your Firebase Web App settings, enable Anonymous Authentication and create Realtime Database.","error");button.disabled=true;return;}
  try{
    app=initializeApp(firebaseConfig);auth=getAuth(app);db=getDatabase(app);
    const credential=await signInAnonymously(auth);uid=credential.user.uid;
    statusText.textContent="Ready to create a secure request";message("Firebase connected. Generate a QR code to begin.");
    button.disabled=false;await createRequest();
  }catch(e){console.error(e);statusText.textContent="Connection failed";message(`${e.code||"Firebase error"}: ${e.message}`,"error");button.disabled=false;}
}
async function createRequest(){
  stopWatch();button.disabled=true;button.textContent="Creating QR code…";
  try{
    if(!uid)throw new Error("Firebase is not connected.");
    token=randomToken();expiresAt=Date.now()+TTL;requestRef=ref(db,`loginRequests/${token}`);
    await set(requestRef,{ownerUid:uid,status:"pending",createdAt:Date.now(),expiresAt});
    const approvalUrl=`${location.origin}${location.pathname.replace(/index\.html$/,"")}approve.html?token=${token}`;
    const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(approvalUrl)}`;
    qrImage.src=qrUrl;qrImage.hidden=false;placeholder.hidden=true;
    statusText.textContent="Waiting for phone approval";message("Scan with your phone. Check the address and approve only if you initiated this request.");
    button.innerHTML='Generate new QR code <span>↗</span>';button.disabled=false;
    unsubscribe=onValue(requestRef,snap=>{
      const data=snap.val();
      if(data?.status==="approved"){
        stopWatch();localStorage.setItem("nightkeyDemoSignedIn","true");
        localStorage.setItem("nightkeyDemoApprovedAt",String(Date.now()));
        statusText.textContent="Login approved";timer.textContent="✓";progress.style.width="100%";
        message("Phone approval received. Opening your dashboard…","success");
        button.disabled=true;button.textContent="Signed in ✓";
        setTimeout(()=>location.href="dashboard.html",700);
      }
    },err=>{console.error(err);message(`Realtime Database: ${err.message}`,"error");});
    expiryTimer=setInterval(updateClock,250);updateClock();
  }catch(e){console.error(e);statusText.textContent="Could not create request";message(`${e.code||"Error"}: ${e.message}`,"error");button.disabled=false;button.innerHTML='Try again <span>↗</span>';}
}
async function updateClock(){
  const left=Math.max(0,Math.ceil((expiresAt-Date.now())/1000));timer.textContent=timeString(left);progress.style.width=`${left/90*100}%`;
  if(left===0){stopWatch();statusText.textContent="QR code expired";message("This QR code expired. Generate a new one to continue.","error");button.disabled=false;button.innerHTML='Generate new QR code <span>↗</span>';try{await remove(requestRef);}catch(e){console.warn("Could not remove expired request",e);}}
}
button.addEventListener("click",createRequest);
init();