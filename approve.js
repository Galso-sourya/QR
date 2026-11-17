import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
const button=document.getElementById("approveButton"),result=document.getElementById("result");
const token=new URLSearchParams(location.search).get("token");
const configReady=firebaseConfig.apiKey!=="PASTE_YOUR_API_KEY" && firebaseConfig.projectId!=="YOUR_PROJECT_ID";
let db,uid,requestRef;
function show(text,type=""){result.textContent=text;result.className=`result ${type}`;}
async function start(){
  if(!configReady){button.disabled=true;show("Firebase setup is incomplete. Configure firebase-config.js first.","error-text");return;}
  if(!token||!/^[a-f0-9]{64}$/.test(token)){button.disabled=true;show("This QR link is invalid.","error-text");return;}
  try{
    const app=initializeApp(firebaseConfig);const auth=getAuth(app);
    const cred=await signInAnonymously(auth);uid=cred.user.uid;db=getDatabase(app);requestRef=ref(db,`loginRequests/${token}`);
    const snap=await get(requestRef);const data=snap.val();
    if(!data||data.status!=="pending"||data.expiresAt<=Date.now()){button.disabled=true;show("This login request is expired or already used. Generate a new QR code.","error-text");}
  }catch(e){console.error(e);button.disabled=true;show(`${e.code||"Firebase error"}: ${e.message}`,"error-text");}
}
button.addEventListener("click",async()=>{
  button.disabled=true;button.textContent="Verifying request…";
  try{
    const snap=await get(requestRef);const data=snap.val();
    if(!data||data.status!=="pending"||data.expiresAt<=Date.now())throw new Error("Request expired or already approved.");
    await update(requestRef,{status:"approved",approvedByUid:uid,approvedAt:Date.now()});
    button.textContent="Approved ✓";button.classList.add("button-approved");show("Success! Your computer should now continue to the dashboard.","success-text");
  }catch(e){console.error(e);button.disabled=false;button.textContent="Try again";show(e.message,"error-text");}
});
start();