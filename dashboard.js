import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
const button=document.getElementById("logoutButton"),message=document.getElementById("logoutMessage");
if(localStorage.getItem("nightkeyDemoSignedIn")!=="true")location.replace("index.html");
else document.getElementById("sessionInfo").textContent=`Approved ${new Date(Number(localStorage.getItem("nightkeyDemoApprovedAt"))).toLocaleString()}`;
button.addEventListener("click",async()=>{
  localStorage.removeItem("nightkeyDemoSignedIn");localStorage.removeItem("nightkeyDemoApprovedAt");
  try{const app=initializeApp(firebaseConfig);const auth=getAuth(app);if(auth.currentUser)await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js").then(m=>m.signOut(auth));}catch(e){console.warn(e);}
  message.textContent="You have signed out.";setTimeout(()=>location.replace("index.html"),500);
});