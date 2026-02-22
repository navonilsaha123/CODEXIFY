import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// SIGNUP
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created!");
  } catch (error) {
    alert(error.message);
  }
});

// LOGIN
document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    alert(error.message);
  }
});

// AUTO LOGIN
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    appScreen.classList.remove("hidden");
  }
});

// LOGOUT
window.firebaseLogout = async function () {
  await signOut(auth);
};

// RESET PASSWORD
window.resetPasswordFirebase = async function(email) {
  if (!email) return alert("Enter email");
  await sendPasswordResetEmail(auth, email);
  alert("Reset email sent!");
};